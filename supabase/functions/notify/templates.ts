/**
 * The four emails, as plain functions from facts to subject, HTML and text.
 * No imports, so the Edge Function (Deno) and the app's tests (Node) can
 * both use this file. Email HTML is tables and inline styles on purpose:
 * that's what mail apps reliably render.
 */

export type EmailKind = 'book_sent' | 'book_arrived' | 'next_in_line' | 'friend_request';

export type EmailFacts = {
  kind: EmailKind;
  /** The person receiving the email. */
  recipient: string;
  /** The other person: who sent it, who got it, who has it, who asked. */
  other: string;
  book?: { title: string; author: string; coverColor: string };
  group?: string;
  /** Where it is now (book_arrived). */
  city?: string;
  /** How many different cities it has been read in (book_arrived). */
  cities?: number;
  /** Whether the sender tucked a letter in (book_sent). */
  hasLetter?: boolean;
  /** The site, ending in a slash; buttons link to pages under it. */
  appUrl: string;
  /** The book's id, so the button opens that book. */
  bookId?: string;
};

export type Email = { subject: string; html: string; text: string };

const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

const unescape = (value: string) =>
  value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Content = {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Shown in a dashed box, e.g. the sealed-letter note. */
  aside?: string;
  button: string;
  why: string;
};

/**
 * Subject, heading and "why" are plain text (escaped when rendered).
 * Paragraphs and the aside are HTML, so names and titles going into them
 * are escaped here: a name is never markup.
 */
function content(facts: EmailFacts): Content {
  const otherText = first(facts.other);
  const titleText = facts.book?.title ?? 'a book';
  const other = escape(otherText);
  const title = escape(titleText);
  const city = facts.city ? escape(facts.city) : undefined;
  const group = facts.group ?? 'your group';

  switch (facts.kind) {
    case 'book_sent':
      return {
        subject: `${otherText} sent you ${titleText}`,
        preheader: "It's in the post. Tap Got it when it arrives.",
        heading: `${titleText} is on its way to you`,
        paragraphs: [
          `${other} put it in the post. When it arrives, open the app and tap <b>Got it</b> so ${other} knows it made it.`,
          "No rush on the reading. Someone's waiting after you, so send it on when you're done.",
        ],
        aside: facts.hasLetter
          ? `&#9993; ${other} tucked a letter inside. It opens once you've finished the book.`
          : undefined,
        button: `Open ${titleText}`,
        why: `You're getting this because you're in line for ${titleText} in ${group}.`,
      };
    case 'book_arrived': {
      const where = city ? ` It's in ${city} now.` : '';
      const count =
        facts.cities && facts.cities > 1
          ? ` It has been read in ${facts.cities} different cities so far.`
          : '';
      return {
        subject: `${titleText} made it to ${otherText}`,
        preheader: `${otherText} tapped Got it.`,
        heading: `${titleText} made it to ${otherText}`,
        paragraphs: [`${other} tapped Got it.${where}${count}`],
        button: 'See its route',
        why: `You're getting this because you sent ${titleText} on in ${group}.`,
      };
    }
    case 'next_in_line':
      return {
        subject: `You're next for ${titleText}`,
        preheader: `${otherText} has it now.`,
        heading: `You're next for ${titleText}`,
        paragraphs: [
          `${other} has it now, and you're next in line. When ${other} is done, it comes to you.`,
        ],
        button: `Open ${titleText}`,
        why: `You're getting this because you're in line for ${titleText} in ${group}.`,
      };
    case 'friend_request':
      return {
        subject: `${otherText} wants to be friends`,
        preheader: 'Friends see what each other is reading.',
        heading: `${otherText} wants to be friends`,
        paragraphs: [
          `${other} asked to be friends on Sisterhood of the Traveling Books. Friends see what each other is reading.`,
        ],
        button: 'Answer in the app',
        why: `You're getting this because ${otherText} sent you a friend request.`,
      };
  }
}

export function renderEmail(facts: EmailFacts): Email {
  const c = content(facts);
  const root = facts.appUrl.endsWith('/') ? facts.appUrl : `${facts.appUrl}/`;
  // The button opens the thing the email is about; settings live on You.
  const target =
    facts.kind === 'friend_request'
      ? `${root}friends`
      : facts.bookId
        ? `${root}b/${encodeURIComponent(facts.bookId)}`
        : root;
  const settings = `${root}you`;
  const cover = facts.book
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${escape(
        facts.book.coverColor,
      )};border-radius:12px;padding:26px 20px 18px 26px;border-left:7px solid rgba(255,255,255,0.35);">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:#1f1a17;">${escape(
      facts.book.title,
    )}</div>
    <div style="font-size:13px;color:#1f1a17;opacity:0.8;margin-top:4px;">${escape(facts.book.author)}</div>
  </td></tr></table>`
    : '';
  const paragraphs = c.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:24px;color:#1f1a17;">${p}</p>`,
    )
    .join('');
  const aside = c.aside
    ? `<div style="border:1px dashed #d8c9bc;border-radius:10px;padding:12px 14px;margin:4px 0 18px;font-size:14px;line-height:20px;color:#54473f;">${c.aside}</div>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f7f1ea;">
<span style="display:none;max-height:0;overflow:hidden;">${escape(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1ea;">
<tr><td align="center" style="padding:20px 16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
<tr><td style="padding:0 4px 14px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#7a5c48;">Sisterhood of the Traveling Books</td></tr>
<tr><td style="background:#fffdfb;border:1px solid #eaded3;border-radius:16px;padding:22px;font-family:-apple-system,Helvetica,Arial,sans-serif;">
  ${cover}
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:30px;color:#1f1a17;margin:22px 0 12px;">${escape(c.heading)}</h1>
  ${paragraphs}
  ${aside}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr><td style="background:#7a5c48;border-radius:12px;">
    <a href="${escape(target)}" style="display:inline-block;padding:13px 22px;color:#fffdfb;font-weight:bold;font-size:15px;text-decoration:none;">${escape(c.button)}</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:16px 6px 0;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#54473f;text-align:center;">
  ${escape(c.why)}<br><i style="font-family:Georgia,serif;">Read it. Write in it. Pass it on.</i><br>
  <a href="${escape(settings)}" style="color:#54473f;">Choose which emails you get: You &rarr; Emails</a>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    c.heading,
    '',
    ...c.paragraphs.map((p) => unescape(p.replace(/<[^>]+>/g, ''))),
    ...(c.aside ? ['', c.aside.replace(/&#9993; /, '').replace(/&[a-z]+;/g, '')] : []),
    '',
    `${c.button}: ${target}`,
    '',
    c.why,
    `Choose which emails you get: ${settings}`,
  ].join('\n');

  return { subject: c.subject, html, text };
}
