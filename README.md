# Sisterhood of the Traveling Books

**Like the Pants, but with pages.** One physical copy goes around a group of
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
| `supabase/seed.example.sql` | The fictional demo group | By hand, if you want it |
| `supabase/seed.local.sql` | Your real group (gitignored) | By hand |

Sign-in links need **Authentication → URL Configuration** to allow
`https://itang1.github.io/book-club/**` (and `http://localhost:8081/**` for
local development).

## Accounts and privacy

- Everyone signs in with an emailed link. No passwords.
- First time in, you either tap **That's me** on your existing profile or make
  a new one. A profile can be claimed once, and an account holds one profile.
- Signed out, the app's public key can read and write nothing.
- Signed in, you can read the club and act only as yourself. Lending and
  passing on are database functions that check you own or hold the book.
- Next: Groups, so each book is visible only to its circle. See
  `docs/groups-and-privacy.md`.

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
