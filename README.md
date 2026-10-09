# Sisterhood of the Traveling Books

**Read it. Write in it. Pass it on.** One physical copy goes around a group of
friends, one reader at a time, and the app keeps track of where it is and
everywhere it's been.

**Live:** https://itang1.github.io/book-club

## How it works

- **Lend a book.** You own the copy; it starts with you.
- **Join the line.** Friends sign themselves up. Nobody is added for them.
- **Pass it on.** The holder hands it to whoever's next and can leave a
  letter: a rating and a note, sealed until the next reader finishes too.
- **It comes home.** When nobody's waiting, it goes back to its owner.
  Anyone can sign up again for a reread.

A book's location is never stored. It's the newest row of an append-only
`handoffs` log, so the full journey is always there and can't be rewritten.

## Run it

```bash
npm install
npm start      # your Supabase project (.env); sign in by emailed link
npm run demo   # the fictional demo group, with a DEV MODE bar to switch people
npm test       # the rules: who has it, who's next, what's sealed
npm run typecheck
supabase/tests/run.sh   # who can see and do what, against a local Postgres
```

`.env` needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(see `.env.example`). Without them the app runs on the demo group.

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

| File | What it is | Runs |
| --- | --- | --- |
| `supabase/schema.sql` | Tables, access rules, functions | Automatically, on every deploy |
| `supabase/sample.sql` | The sample club: the Carmen, Lena, Tibby and Bridget passing five classics around | Automatically, after schema.sql |
| `supabase/seed.local.sql` | Your real groups and books (gitignored) | By hand |

**The sample club.** Everyone is added to The Traveling Pants when they
join, so there's a group with some history to look around. It's read-only
for real people, and real members can't see each other through it.

Sign-in links need **Authentication → URL Configuration** to allow
`https://itang1.github.io/book-club/**` (and `http://localhost:8081/**` for
local development).

## Emails

People get an email when a book is sent to them, when one they sent
arrives, when they're next in line, and when someone asks to be friends.
Each can be turned off under **You → Emails**.

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
   `notifications`, event Insert, type *Supabase Edge Functions*, function
   `notify`. Emails then go out within seconds of being queued.

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
src/screens/            Books, book detail, Lend, Friends, You, Sign in, Welcome
src/components/         cards, route, charts, tab bar, About
src/lib/useBookClub.ts  all club state and every change to it
src/lib/bookState.ts    holder, line, status: derived from the log
src/lib/stats.ts        numbers behind the visualisations
src/content/about.ts    the Rules of the Books and the bio
supabase/               schema and seeds
docs/                   plans
```

## Notes

- The free Supabase project is kept awake by
  [`hub`](https://github.com/itang1/hub#supabase-keep-alive).
- A fan homage to *The Sisterhood of the Traveling Pants* by Ann Brashares.
  Not affiliated with the author or publisher.
- Made by Irene. MIT licensed.
