# Sisterhood of the Traveling Books

**Track the books your friends pass around.**

[![Expo](https://img.shields.io/badge/Expo-52-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-c38e63.svg)](#license)

A reading club for people who share **physical** copies. One book goes around the
group, one person at a time, and the app keeps track of where it is and
everywhere it's been.

> **Live:** https://itang1.github.io/book-club, once Pages is switched on
> (see [Deploying the web build](#deploying-the-web-build))

---

## Why it exists

Goodreads and StoryGraph catalogue books you've *finished*. This tracks a single
object that can only be in one place at a time — which is the entire point. The
waiting is a feature. Your turn means something because someone has to hand it
to you.

Instead of asking the group chat "who has that copy of *Little Women*?", you
open the app.

## Example: a book's journey

Carmen adds her copy of the book that started it all, and friends sign up
for it. Here's what the app shows
Lena, who has it now:

```
The Sisterhood of the Traveling Pants — Ann Brashares
  2 readers so far · 2 places visited · 41 days travelling

  With            Lena Kaligaris
  Belongs to      Carmen Lowell
  Next in line    Tibby Rollins
  Last activity   12d ago

                    [ YOUR TURN · IT'S WITH YOU ]
  [ Pass on to Tibby Rollins ]

  THE LINE
  ○ Carmen Lowell      Charleston, SC         done      · owner
  ● Lena Kaligaris     Santorini, Greece      reading   ← has it now
  ○ Tibby Rollins      Bethesda, MD           waiting   ← up next

  TRAVEL HISTORY
  Carmen Lowell → Lena Kaligaris
    Sep 26, 2026 · still reading
    ✉ Sealed letter from Carmen Lowell. It opens once you've finished the book.
  Entered circulation with Carmen Lowell
    Aug 28, 2026 · held 29 days
```

Tapping **Pass on** asks for an optional rating and note (the letter), then
appends a leg to the history. It never overwrites the last one, which is why
"places visited" is answerable at all. Once nobody is waiting, the holder can
**Return** it to its owner.

The demo data is the four girls from the novel, each lending a book that suits
her (*The Sisterhood of the Traveling Pants*, *A Room with a View*, *Little
Women*, *Anne of Green Gables*), in the places they spend that first summer: Lena with her grandparents on Santorini, Bridget at soccer camp in
Baja, Carmen visiting her dad in Charleston, Tibby holding down the summer at
home in Bethesda.

## Features

- **Books** — "Your turn" first, a short "Recently" feed, then every copy in
  circulation. **+** adds a copy.
- **Book Detail** — join or leave the line, pass it on or send it home, and the
  full travel history with each reader's letter
- **Friends** — your friends and what each is reading, "People you may know"
  (by mutual friends and shared books), and an invite link for someone new
- **You** — your profile: what's in your hands, what's heading your way, books
  finished, letters written
- **Welcome** — first launch on a device: make your own profile. Opened from an
  invite link, you start out friends with whoever sent it.

### Signing in, and dev mode

There are two ways to run the app, and they never mix:

| | `npm start` | `npm run demo` |
| --- | --- | --- |
| Data | Your Supabase project (`.env`) | The fictional demo group |
| Who you are | Whoever signs in, by emailed link | Anyone: a **DEV MODE** bar at the top switches people |
| Writes | Checked by the database: only as yourself | Kept in memory |

Against a real database there's no switching people: the database only lets
you act as the account you signed in with. Existing members are linked to their
accounts by email on first sign-in (`profile_claims`, filled in from
`seed.local.sql`). Someone new makes their own profile after signing in.

The deployed site is always the `npm start` kind. Both scripts clear Metro's
cache on start, because it otherwise keeps the previous mode's settings baked
into compiled files.

### Reading it again

A past reader can **Join the line to reread**. Whether someone has read a copy
comes from the handoff log (did they ever pass it on?), so a second read never
re-seals letters they've opened.

### Visualisations

- **The route** (each book): every stop the copy has made, who has it now, and
  a dotted line to whoever's waiting, then home.
- **Your reading** (You): books finished per month for the last year; tap a
  column for the titles.
- **Where your books have been** (You): a passport stamp for every place your
  copies have visited.
- **The club's year** (bottom of Books): handoffs, letters, readers and places
  so far this year; the full year in review is meant for December.

All of it is derived from the handoff log (`src/lib/stats.ts`).

### The line is opt-in

Nobody is put in line for a book. A new copy's queue holds only its owner, and
friends tap **Join the line** if they want it. Next in line is the earliest
sign-up who hasn't had a turn. You can leave the line while you're still
waiting.

### Letters in the book

When you pass a copy on, you can tuck in a letter: 1–5 stars and a short note,
saved with the handoff. Letters stay **sealed** until you've finished the copy
yourself, so nobody's opinion colours your read.

## How location works

A book's current location is **not stored**. It's derived from the newest row in
an append-only log:

```sql
handoffs(id, book_id, from_friend, to_friend, happened_at, note, rating)
```

Passing a book on appends a leg. `from_friend` is `null` for the leg that first
put a book into circulation, and the journey log has no update or delete policy —
history can't be rewritten, even by a signed-in user.

A book's status ("Being read", "Back home") isn't stored either; it's derived
from the same log. The owner is whoever the first leg went to.

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
| Stamp | `#a6463a` | library-stamp red, only for "your turn" |
| Border | `#eaded3` | hairline |
| Soft | `#f0e5dc` | light beige |

Titles are set in the platform serif (Georgia on iOS and web), so no font files
ship. Cover swatches carry near-black text, which clears 5.7:1 on every swatch.
All of it lives in `src/theme.ts`.

## Getting Started

### Prerequisites

- Node.js 18+
- A device, simulator, or just a browser

### Install and run

```bash
npm install

npm start          # Expo dev server, against your Supabase (sign in to use it)
npm run demo       # Expo dev server on the demo group, with the dev bar
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # browser
```

With no `.env`, or under `npm run demo`, it runs on fictional seed data — no
backend required.

**Which people you see depends on `.env`.** With no Supabase credentials, the
app shows the fictional demo group (Lena, Tibby, Carmen, Bridget) from
`src/data/mockData.ts`. With credentials, it shows whatever is in that database
and never mixes in the demo group. A public demo should be built without your
`.env`, or pointed at a separate Supabase project seeded from
`seed.example.sql`.

### Deploying the web build

Every push to `main` builds the web app and publishes it to GitHub Pages
(`.github/workflows/deploy-web.yml`). One-time setup on GitHub:

1. **Settings → Pages → Source:** GitHub Actions.
2. **Settings → Secrets and variables → Actions:** add
   `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Leave them
   out to publish the fictional demo group instead.
3. Optional but recommended: add `SUPABASE_DB_URL`, the **Session pooler**
   connection string from Supabase's **Connect** button with your database
   password filled in. With it, every push applies `supabase/schema.sql` to the
   database before the site builds, so you never paste SQL into the dashboard.
   It runs in one transaction; if it fails, nothing changes and the site isn't
   redeployed. This one is a real secret (full database access), so it lives
   only in GitHub, never in an `EXPO_PUBLIC_` variable.
4. Push, or run the workflow from the Actions tab.

Seed files (`seed.example.sql`, `seed.local.sql`) are never run automatically.

### Sign-in settings in Supabase

Sign-in links only work if Supabase knows where to send people back to.
**Authentication → URL Configuration:**

- **Site URL:** `https://itang1.github.io/book-club/`
- **Redirect URLs:** add `https://itang1.github.io/book-club/**` and, for
  local development, `http://localhost:8081/**`

Supabase's built-in email sender allows only a few sign-in emails per hour.
That's fine for a friend group; before opening up, connect your own email
provider under **Authentication → Emails → SMTP Settings**.

The site lands at https://itang1.github.io/book-club. The workflow sets
`EXPO_BASE_URL=/book-club` so asset paths resolve under the repo subpath
(`app.config.js`); locally it's unset and the dev server stays at `/`.

To build by hand:

```bash
EXPO_BASE_URL=/book-club npx expo export --platform web --output-dir dist
```

## Project Structure

```
src/
├── components/
│   └── BookCard.tsx           # Book summary card
├── screens/
│   ├── HomeScreen.tsx         # Your turn, Recently, books in circulation
│   ├── BookDetailScreen.tsx   # The line, history, letters, handoff
│   ├── FriendsScreen.tsx      # The group, add a friend
│   ├── AddBookScreen.tsx      # Add a copy
│   ├── SignInScreen.tsx       # Email me a sign-in link
│   ├── WelcomeScreen.tsx      # Make your profile
│   └── ProfileScreen.tsx      # Your own view
├── data/
│   └── mockData.ts            # Fictional seed group
├── lib/
│   ├── supabase.ts            # Client setup
│   ├── bookClubService.ts     # Row mappers + fallback to mock data
│   ├── useBookClub.ts         # All club state and every change to it
│   ├── friendGraph.ts         # Friends and "people you may know"
│   ├── invite.ts              # Invite links
│   ├── auth.ts                # Sign-in by emailed link
│   ├── devMode.ts             # When the dev bar shows
│   ├── stats.ts               # Numbers behind the visualisations
│   ├── identity.ts            # Who's reading, remembered on this device
│   └── bookState.ts           # Derives location/next in line/status/history
├── theme.ts
└── types.ts
```

## Database

Supabase (Postgres). Five tables:

- **books** — title, author, cover color
- **friends** — the group (name, location, contact)
- **friendships** — who is friends with whom, one row per pair
- **reading_queue** — who signed up, in order, plus each reader's progress
- **handoffs** — the append-only journey log location derives from, with the
  passer's letter

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

Everything requires signing in. The anon key compiled into the app can read
and write nothing on its own. Signed in, you can read the whole club and write
only as yourself; lending and passing on go through database functions
(`lend_book`, `pass_on`) that check you own or hold the book.

Still to come: every signed-in member can read every book and person. Groups
narrow that (`docs/groups-and-privacy.md`).

## Roadmap

- Friend requests and Groups (`docs/groups-and-privacy.md`)
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
