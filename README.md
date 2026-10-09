# Sisterhood of the Traveling Book

**Track the books your friends pass around.**

[![Expo](https://img.shields.io/badge/Expo-52-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-c38e63.svg)](#license)

A reading club for people who share **physical** copies. One book goes around the
group, one person at a time, and the app keeps track of where it is and
everywhere it's been.

> **Live demo:** _placeholder_ — https://itang1.github.io/book-club
> (not deployed yet; see [Deploying the web build](#deploying-the-web-build))

---

## Why it exists

Goodreads and StoryGraph catalogue books you've *finished*. This tracks a single
object that can only be in one place at a time — which is the entire point. The
waiting is a feature. Your turn means something because someone has to hand it
to you.

Instead of asking the group chat "who has that copy of *The Secret Life of
Bees*?", you open the app.

## Example: a book's journey

Four readers pass one copy around. Here's what the app knows after three
handoffs:

```
The Secret Life of Bees — Sue Monk Kidd
  3 stops · 3 cities · 94 days out                      [ reading ]

  Current owner   Lena Kaligaris
  Next stop       Tibby Rollins
  Last activity   12d ago

  READING PATH
  ○ Carmen Lowell      Charleston, SC         done
  ● Lena Kaligaris     Santorini, Greece      reading   ← has it now
  ○ Tibby Rollins      Bethesda, MD           waiting   ← up next
  ○ Bridget Vreeland   Baja California        waiting

  TRAVEL HISTORY
  Carmen Lowell → Lena Kaligaris
    Aug 26, 2026 · held 29 days
  Entered circulation with Carmen Lowell
    Jul 28, 2026 · held 29 days

  [ Pass on to Tibby Rollins ]
```

Tapping **Pass on** appends a leg to the history. It never overwrites the last
one — which is why "3 cities over 94 days" is answerable at all.

The demo data is the four girls from the novel, in the places they spend that
first summer: Lena with her grandparents on Santorini, Bridget at soccer camp in
Baja, Carmen visiting her dad in Charleston, Tibby holding down the summer at
home in Bethesda.

## Features

- **Home** — every copy in circulation, with who has it and who's next
- **Book Detail** — the reading path, the full travel history, and a one-tap
  handoff
- **Friends** — the group, each person's status derived *per book*
- **Add Book** — introduce a copy and pick its first reader; the queue follows
  the group from there
- **Profile** — your own view: what's in your hands, what's heading your way

## How location works

A book's current location is **not stored**. It's derived from the newest row in
an append-only log:

```sql
handoffs(id, book_id, from_friend, to_friend, happened_at)
```

Passing a book on appends a leg. `from_friend` is `null` for the leg that first
put a book into circulation, and the journey log has no update or delete policy —
history can't be rewritten, even by a signed-in user.

Reading status lives on `reading_queue`, keyed by *(book, friend)*, rather than
on the friend — the same person can be reading one copy while waiting on
another.

## Design

A warm, tactile palette, chosen to feel like a used bookstore rather than a SaaS
dashboard.

| Token | Hex | Role |
| --- | --- | --- |
| Background | `#f7f1ea` | warm paper |
| Card | `#fffdfb` | off-white |
| Text | `#1f1a17` | near-black |
| Muted | `#54473f` | taupe |
| Accent | `#7a5c48` | warm brown |
| Border | `#eaded3` | hairline |
| Soft | `#f0e5dc` | light beige |

All of it lives in `src/theme.ts`.

## Getting Started

### Prerequisites

- Node.js 18+
- A device, simulator, or just a browser

### Install and run

```bash
npm install

npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # browser
```

Out of the box it runs on fictional seed data — no backend required.

### Deploying the web build

```bash
npx expo export --platform web --output-dir dist
```

That produces a static site in `dist/`, deployable to GitHub Pages, Netlify, or
Vercel. For GitHub Pages under a repo subpath, add `--base-url /book-club` so
asset paths resolve.

## Project Structure

```
src/
├── components/
│   └── BookCard.tsx           # Book summary card
├── screens/
│   ├── HomeScreen.tsx         # Books in circulation
│   ├── BookDetailScreen.tsx   # Reading path, history, handoff
│   ├── FriendsScreen.tsx      # The group
│   ├── AddBookScreen.tsx      # Add a copy / add a friend
│   └── ProfileScreen.tsx      # Your own view
├── data/
│   └── mockData.ts            # Fictional seed group
├── lib/
│   ├── supabase.ts            # Client setup
│   ├── bookClubService.ts     # Row mappers + fallback to mock data
│   └── bookState.ts           # Derives location/next stop/history
├── theme.ts
└── types.ts
```

## Database

Supabase (Postgres). Four tables:

- **books** — title, author, cover color, status
- **friends** — the group (name, location, contact)
- **reading_queue** — travel order plus each reader's progress
- **handoffs** — the append-only journey log location derives from

Plus a `book_current_location` view for ad-hoc queries, which the app recomputes
client-side.

Supabase returns `snake_case`; the app speaks `camelCase`. Every row crosses that
boundary through an explicit mapper in `src/lib/bookClubService.ts` — casting a
raw row to `Book` compiles but lies, and the mismatch only surfaces at runtime.

### Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (structure only, safe to re-run).
3. Seed it:
   - `supabase/seed.example.sql` — fictional demo group, committed
   - `supabase/seed.local.sql` — your real group; **gitignored**, create it by
     copying the example
4. `cp .env.example .env` and fill in your project URL and anon key.

The app loads live data when configured and falls back to the fictional seed
otherwise.

### Keeping the free-tier project awake

Supabase pauses free-tier projects after roughly a week of inactivity, and a
paused project has to be restored by hand from the dashboard — so the first
person to open the app after a quiet week would find it broken.

That ping lives outside this repo, in
[`itang1/keep-supabase-alive`](https://github.com/itang1/keep-supabase-alive) —
one private repo that pings every project from a matrix, rather than a copy of
the same workflow in each app. It runs a tiny read query against `books` every
Monday and Thursday.

This app's entry needs two secrets **on that repo**, not this one:

| Secret | Value |
| --- | --- |
| `BOOK_CLUB_SUPABASE_URL` | this project's URL |
| `BOOK_CLUB_SUPABASE_ANON_KEY` | this project's publishable/anon key |

Until they're set, that matrix entry skips with a notice instead of failing.

Keeping it private also matters: GitHub only auto-disables scheduled workflows
in *public* repos after 60 days of inactivity, so a private scheduler keeps
running through a quiet stretch. It still only prevents pausing — it cannot wake
an already-paused project — so check the dashboard after the first quiet week.

### Keeping real names out of the repo

This repository is public. Real names, cities, and emails belong only in
Supabase, never in a committed file. Two rules enforce it:

- `src/data/mockData.ts` is the offline fallback and is **always fictional**
- anything matching `*.local.sql` is gitignored

### Security status

The policies in `schema.sql` are **demo-open**: anyone may read and write every
row. The anon key is prefixed `EXPO_PUBLIC_`, so it's compiled into the client
bundle — an open policy plus a published key means the data is effectively
public.

Until Supabase Auth is wired up, treat the database as semi-public: fine for book
titles and first names, not for addresses or emails. Once auth exists, apply
`supabase/policies-authenticated.sql` to require a signed-in user.

## Roadmap

- Accounts and friend requests, so a group is built by invitation rather than by
  hand-editing SQL
- Per-book audience, so a friend-of-a-friend can spot a copy and ask for a spot
  in its queue
- Push notification when a book is handed to you
- Margin notes attached to a specific leg of the journey
- A map of everywhere a copy has been

## Tech Stack

React Native · Expo · TypeScript (strict) · React Navigation · Supabase ·
Ionicons

## License

MIT
