<p align="center">
  <img src="assets/crest.png" width="64" alt="The Traveling Books crest" />
</p>

# The Traveling Books

[![Deploy](https://github.com/itang1/book-club/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/itang1/book-club/actions/workflows/deploy-web.yml)
[![CI](https://github.com/itang1/book-club/actions/workflows/ci.yml/badge.svg)](https://github.com/itang1/book-club/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-1f3b2c.svg)](LICENSE)

**Read it, write in it, and pass it on.** One physical copy goes around a group of
friends, one reader at a time, and the app keeps track of where it is and
everywhere it's been.

**Live:** https://itang1.github.io/book-club

![Home, a book's page, and Friends & Groups](docs/screenshots.png)

## How it works

- **Lend a book.** You own the copy, so it starts with you.
- **Join the line.** Friends sign themselves up to request a book.
- **Pass it on.** The holder mails it to whoever's next in line and can leave a
  rating and a note about the book, sealed until the next reader finishes too.
  The handwritten letter is separate: tuck it in the package, about anything
  at all.
- **It comes home.** When nobody's waiting, it goes back to its owner.
  Anyone can sign up again for a reread. An owner can also **call it home**
  at any time: it comes back next, and the line waits.
- **Scan your shelf.** One photo of a bookshelf adds every book it can read,
  so friends can see what you have and ask to borrow it.

A book's location is never stored. It's the newest row of an append-only
`handoffs` log, so the full journey is always there and can't be rewritten.

## Run it

```bash
nvm use && npm install
npm run demo       # the fictional demo, with a DEV MODE bar to switch people
npm start          # your own Supabase project (.env); sign in by emailed link
```

`.env` needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(see `.env.example`). Without them the app runs on the demo.

## Develop

```bash
npm run check      # types, lint, formatting, unit tests
npm run test:db    # who can see and do what, as real users, against a local Postgres
npm run sample:sql # regenerate supabase/sample.sql from src/data/sampleClubs.ts
npm run icons      # render the icons and share card from assets/*.svg
```

CI runs the checks, the database tests and a web build on every pull request.
See [CONTRIBUTING.md](CONTRIBUTING.md) for how the code is laid out and the
conventions it keeps, and [SECURITY.md](SECURITY.md) to report a problem.

## Deploy

GitHub Pages is already set up. Every push to `main`:

1. applies `supabase/schema.sql` to the database (`SUPABASE_DB_URL`, the
   Session pooler connection string),
2. builds the web app,
3. publishes it to Pages.

The workflow is `.github/workflows/deploy-web.yml`. The repo secrets it uses
are already set: `SUPABASE_DB_URL`, `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Supabase

| File                      | What it is                                                   | Runs                            |
| ------------------------- | ------------------------------------------------------------ | ------------------------------- |
| `supabase/schema.sql`     | Tables, access rules, functions                              | Automatically, on every deploy  |
| `supabase/sample.sql`     | The sample groups (generated from `src/data/sampleClubs.ts`) | Automatically, after schema.sql |
| `supabase/seed.local.sql` | Your real groups and books (gitignored)                      | By hand                         |

**The sample groups.** Everyone is added to four when they join: The
Traveling Pants, Central Perk Regulars (_Friends_), The Upper East Side
(_Gossip Girl_) and The Pritchett-Dunphys (_Modern Family_). Each has books in
the post, notes on the way and lines waiting, so a newcomer walks into
something already moving. They're read-only for real people, and real
members can't see each other through them. The dates stay fresh: each deploy
re-anchors them to now, and `refresh_sample_dates()` moves them forward every
hour, so "sent 5 hours ago" stays true.

To change them, edit `src/data/sampleClubs.ts` (the demo reads it too) and
run `npm run sample:sql` to rewrite `supabase/sample.sql`. `npm test` fails
while the two disagree.

Sign-in links need **Authentication → URL Configuration** to allow
`https://itang1.github.io/book-club/**` (and `http://localhost:8081/**` for
local development). The sign-in email itself is `supabase/templates/sign-in.html`,
installed in the house style by every deploy.

## Emails

Every email starts **off**: the app is quiet until someone chooses
otherwise. Under **Profile → Emails** each person can turn on any of: a new
book joining their group, a book sent to them, a book they sent arriving,
being next in line, friend requests, and gentle reminders, with one switch at
the top for all of them.

Reminders stay rare: at most one per person per 30 days. "Has it reached
you?" goes once per trip, when Got it is untapped after 5 days; "How's it
going?" goes once per stay, after 4 weeks, when a friend is waiting. They're
queued daily at 17:00 UTC by `queue_reminders()` (pg_cron) and share one
switch, Gentle reminders.

How it works: the database queues an email in `notifications` whenever one
of those happens (and the person wants it); the `notify` Edge Function
(`supabase/functions/notify`) sends what's queued over SMTP from your own
mail account, and is deployed by the workflow. Supabase can only send its
own sign-in emails, so the mail goes out through an ordinary account such
as Gmail.

One-time setup:

1. **Gmail app password.** Turn on 2-Step Verification for the Gmail account,
   then create an app password (Google Account → Security → App passwords).
2. **GitHub secrets:** `SMTP_USER` (the Gmail address), `SMTP_PASS` (the app
   password), and `SUPABASE_ACCESS_TOKEN` (Supabase → Account → Access
   Tokens). The next deploy sets up and deploys the function.
3. **Database webhook** (Supabase → Database → Webhooks → Create): table
   `notifications`, event Insert, type _Supabase Edge Functions_, function
   `notify`. Emails then go out within seconds of being queued.

## Bookshelves

The **Shelf** tab lets you photograph your shelves; `supabase/functions/scan-shelf`
sends the photo to Gemini, which suggests titles and authors. You tick, fix or
drop each guess before anything is saved. People who share a real group with you
can browse your shelf and **Ask to borrow** (you get an email and say yes or not
now); any book can be **lent to a group**, which turns it into a Traveling Book
with a line and a journey.

One-time setup: add a `GEMINI_API_KEY` repo secret (from Google AI Studio). The
deploy then sets it as a function secret and deploys `scan-shelf`. Optionally set
`GEMINI_MODEL` on the function (default `gemini-2.5-flash`). Without the key the
Shelf still works; scanning says it isn't set up and you can add books by hand.

## Backups

`.github/workflows/backup.yml` dumps the data every night at 06:23 UTC,
encrypts it, and keeps it as a workflow artifact for 90 days. Add one repo
secret, `BACKUP_PASSPHRASE` (a long random passphrase, also saved in a
password manager), and run the workflow once by hand from the Actions tab to
check it. Restore instructions are at the top of the workflow file.

## Accounts and privacy

- Everyone signs in with an emailed link. No passwords.
- **Groups** are the circles books are lent within. Every book belongs to one,
  and only its members (plus whoever's reading or waiting for it) can see it.
  You join by the group's invite link.
- **Friends** are social: requests need accepting, and either side can
  unfriend, silently. Being friends doesn't open anyone's books.
- Opening an invite link, people who were added before accounts existed tap
  **That's me** to claim their profile; anyone else makes a new one.
- Signed out, the app's public key can read and write nothing; a stranger
  who signs up sees nobody until they're invited somewhere.
- The database enforces all of it (`supabase/schema.sql`), and
  `supabase/tests/` checks it as real users on every deploy.

The repo is public, so real names live only in Supabase and in gitignored
`*.local.sql` files. `src/data/mockData.ts` is always fictional.

## Project layout

```
App.tsx                 navigation, sign-in gate
src/screens/            Books, book, Lend, Friends & Groups, a group, You, Sign in, Welcome
src/components/         cards, route, charts, tab bar, About
src/lib/useBookClub.ts  all club state and every change to it
src/lib/bookState.ts    holder, line, status: derived from the log
src/lib/stats.ts        numbers behind the visualisations
src/content/about.ts    the Rules of the Books and the bio
src/data/sampleClubs.ts the sample groups, for the demo and sample.sql
assets/crest.svg        the crest; `node scripts/icons.js` renders the icons from it
supabase/               schema and seeds
docs/                   plans
```

## Notes

- The free Supabase project is kept awake by
  [`hub`](https://github.com/itang1/hub#supabase-keep-alive).
- A fan homage to the _Traveling Pants_ series by Ann Brashares.
  Not affiliated with the author or publisher.
- Made by Irene. MIT licensed.
