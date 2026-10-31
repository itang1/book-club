import { sampleClubs, sampleQueue, type SampleClub } from './sampleClubs';

/**
 * supabase/sample.sql, written from sampleClubs.ts. Run `npm run sample:sql`
 * after changing the sample data; a test fails while the two disagree.
 */
export function sampleSql(clubs: SampleClub[] = sampleClubs): string {
  const q = (value: string | null | undefined) =>
    value === null || value === undefined ? 'null' : `'${value.replace(/'/g, "''")}'`;
  const ago = (days: number) =>
    days < 1 ? `now() - interval '${Math.round(days * 24)} hours'` : `now() - interval '${days} days'`;
  const rows = (lines: string[]) => lines.join(',\n');

  const groups = clubs.map((club) => `  (${q(club.id)}, ${q(club.name)}, ${q(club.inviteCode)}, true)`);
  const people = clubs.flatMap((club) =>
    club.people.map((p) => `  (${q(p.id)}, ${q(p.name)}, ${q(p.city)}, ${q(p.state)}, now(), true)`),
  );
  const books = clubs.flatMap((club) =>
    club.books.map(
      (b) => `  (${q(b.id)}, ${q(b.title)}, ${q(b.author)}, ${q(b.color)}, ${q(b.giftedBy)}, ${q(club.id)})`,
    ),
  );
  const queue = clubs.flatMap((club) =>
    club.books.flatMap((b) =>
      sampleQueue(b).map((e) => `  (${q(b.id)}, ${q(e.friendId)}, ${e.position}, ${q(e.status)})`),
    ),
  );
  const handoffs = clubs.flatMap((club) =>
    club.books.flatMap((b) =>
      b.journey.map((stop, index) => {
        const person = club.people.find((p) => p.id === stop.to);
        if (!person) throw new Error(`${b.id}: ${stop.to} isn't in ${club.name}`);
        const got = stop.got === undefined ? stop.sent : stop.got;
        const [city, region] = got === null ? [null, null] : (stop.place ?? [person.city, person.state]);
        return (
          `  (${q(`${b.id}-${index + 1}`)}, ${q(b.id)}, ${q(index ? b.journey[index - 1].to : null)}, ${q(stop.to)}, ` +
          `${ago(stop.sent)}, ${got === null ? 'null' : ago(got)}, ${q(city)}, ${q(region)}, ` +
          `${stop.rating ?? 'null'}, ${q(stop.note)})`
        );
      }),
    ),
  );
  const covers = clubs.flatMap((club) =>
    club.books.filter((b) => b.cover).map((b) => `  (${q(b.id)}, ${q(b.cover)})`),
  );

  return `-- The sample groups: ${clubs.map((club) => club.name).join(', ')}.
--
-- GENERATED from src/data/sampleClubs.ts by \`npm run sample:sql\`. Edit that
-- file, not this one.
--
-- Fictional casts passing books around. Every member of the app is in these
-- groups (schema.sql adds them automatically), so a newcomer walks into
-- groups with history and books on the move. They're read-only for real
-- people, and real members can't see each other through them.
--
-- Applied after schema.sql on every deploy, so it must stay safe to re-run.
-- Each run re-anchors the dates to now, and refresh_sample_dates() (hourly,
-- in schema.sql) keeps them there, so "sent 5 hours ago" stays true.

insert into public.groups (id, name, invite_code, is_sample) values
${rows(groups)}
on conflict (id) do update set name = excluded.name, is_sample = true;

insert into public.friends (id, name, city, state, agreed_rules_at, is_character) values
${rows(people)}
on conflict (id) do update
  set name = excluded.name, city = excluded.city, state = excluded.state, is_character = true;

insert into public.books (id, title, author, cover_color, gifted_by, group_id) values
${rows(books)}
on conflict (id) do update
  set title = excluded.title, author = excluded.author, cover_color = excluded.cover_color,
      gifted_by = excluded.gifted_by, group_id = excluded.group_id;

insert into public.reading_queue (book_id, friend_id, position, status) values
${rows(queue)}
on conflict (book_id, friend_id) do update set position = excluded.position, status = excluded.status;

insert into public.handoffs
  (id, book_id, from_friend, to_friend, happened_at, received_at, place_city, place_region, rating, note)
values
${rows(handoffs)}
on conflict (id) do update
  set happened_at = excluded.happened_at, received_at = excluded.received_at,
      place_city = excluded.place_city, place_region = excluded.place_region,
      rating = excluded.rating, note = excluded.note;

update public.sample_clock set anchored_at = now();

-- Everyone already in the app is in the sample groups too (new people are
-- added as they join, by the trigger in schema.sql).
insert into public.group_members (group_id, person_id)
select g.id, f.id from public.groups g cross join public.friends f
where g.is_sample
on conflict do nothing;

-- Covers from Open Library.
update public.books b set cover_url = 'https://covers.openlibrary.org/b/id/' || c.cover_id || '-M.jpg'
from (values
${rows(covers)}
) as c(book_id, cover_id)
where b.id = c.book_id and b.cover_url is null;
`;
}
