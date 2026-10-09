// Sends the emails waiting in the notifications outbox (filled by triggers in
// schema.sql), then stamps each one sent, or records why it couldn't be.
//
// Runs on Supabase (Deno). Called by a Database Webhook on inserts into
// public.notifications, so emails go out within seconds; each call also
// sweeps up anything older still unsent.
//
// Mail goes out over SMTP from your own email account (e.g. Gmail with an
// app password); Supabase itself can only send its own sign-in emails.
// Secrets, set once with `supabase secrets set` (the deploy workflow does it
// from GitHub secrets):
//   SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465),
//   SMTP_USER, SMTP_PASS, APP_URL (default the GitHub Pages address)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

import { EmailFacts, EmailKind, renderEmail } from './templates.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const APP_URL = Deno.env.get('APP_URL') ?? 'https://itang1.github.io/book-club/';
const SMTP_USER = Deno.env.get('SMTP_USER') ?? '';
const FROM = `Sisterhood of the Traveling Books <${SMTP_USER}>`;

type Row = {
  id: number;
  created_at: string;
  person_id: string;
  kind: EmailKind;
  book_id: string | null;
  about_person: string | null;
};

type Person = { id: string; name: string; user_id: string | null };

async function person(id: string | null): Promise<Person | null> {
  if (!id) return null;
  const { data } = await db.from('friends').select('id, name, user_id').eq('id', id).maybeSingle();
  return data;
}

/** Everything a template needs for one outbox row, plus the address. */
async function factsFor(row: Row): Promise<{ to: string; facts: EmailFacts } | null> {
  const recipient = await person(row.person_id);
  const other = await person(row.about_person);
  if (!recipient?.user_id || !other) return null;

  const { data: account } = await db.auth.admin.getUserById(recipient.user_id);
  const to = account?.user?.email;
  if (!to) return null;

  const facts: EmailFacts = {
    kind: row.kind,
    recipient: recipient.name,
    other: other.name,
    appUrl: APP_URL,
  };

  if (row.book_id) {
    const { data: book } = await db
      .from('books')
      .select('title, author, cover_color, group_id')
      .eq('id', row.book_id)
      .maybeSingle();
    if (book) {
      facts.book = { title: book.title, author: book.author, coverColor: book.cover_color };
      const { data: group } = await db
        .from('groups')
        .select('name')
        .eq('id', book.group_id)
        .maybeSingle();
      facts.group = group?.name;
    }

    const { data: legs } = await db
      .from('handoffs')
      .select('place_city, place_region, note, rating, happened_at')
      .eq('book_id', row.book_id)
      .order('happened_at');
    const latest = legs?.[legs.length - 1];
    facts.city = latest?.place_city ?? undefined;
    facts.cities = new Set(
      (legs ?? [])
        .filter((leg) => leg.place_city)
        .map((leg) => `${leg.place_city}|${leg.place_region ?? ''}`.toLowerCase()),
    ).size;
    facts.hasLetter = Boolean(latest?.note || latest?.rating);
  }

  return { to, facts };
}

Deno.serve(async () => {
  const { data: rows, error } = await db
    .from('notifications')
    .select('id, created_at, person_id, kind, book_id, about_person')
    .is('sent_at', null)
    .is('error', null)
    .order('id')
    .limit(25);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!rows?.length) {
    return new Response(JSON.stringify({ sent: 0 }));
  }

  const smtp = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(Deno.env.get('SMTP_PORT') ?? 465),
      tls: true,
      auth: { username: SMTP_USER, password: Deno.env.get('SMTP_PASS') ?? '' },
    },
  });

  let sent = 0;
  const stale = Date.now() - 2 * 24 * 60 * 60 * 1000;
  for (const row of rows as Row[]) {
    // Queued long ago (say, before sending was set up): old news, so skip it.
    if (Date.parse(row.created_at) < stale) {
      await db.from('notifications').update({ error: 'Too old to send' }).eq('id', row.id);
      continue;
    }

    try {
      const found = await factsFor(row);
      if (!found) {
        await db.from('notifications').update({ error: 'No email address' }).eq('id', row.id);
        continue;
      }

      const email = renderEmail(found.facts);
      await smtp.send({
        from: FROM,
        to: found.to,
        subject: email.subject,
        content: email.text,
        html: email.html,
      });
      await db.from('notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id);
      sent += 1;
    } catch (failure) {
      // Recorded, not retried forever: a bad address shouldn't block the rest.
      await db
        .from('notifications')
        .update({ error: String(failure).slice(0, 500) })
        .eq('id', row.id);
    }
  }

  await smtp.close();
  return new Response(JSON.stringify({ sent }));
});
