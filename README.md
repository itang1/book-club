# Sisterhood of the Traveling Book

One book, many readers, a shared reading journey.

A React Native app that tracks the journey of physical books as they travel between friends in your reading circle.

## What is Sisterhood of the Traveling Book?

It's a simple way to follow where a book is, who has it, and how it moves over time. Instead of wondering "who has that copy of *The Secret Life of Bees*?", you just open the app.

This is a **book circulation tracker**, not a shipping app — no tracking numbers, no carriers, no parcels. Just the book, the circle, and where the copy is right now.

**The core idea:** shared copies of books travel between friends. This app is the ledger.

## Features

- **Home** — See all books currently in circulation, sorted by status
- **Book Cards** — Quick view of title, author, current owner, next stop, and status
- **Book Detail** — The reading path, the full travel history, and a "pass it on" action
- **Friends** — The reading circle, with each person's status derived per book
- **Add Book** — Introduce a new traveling copy and pick its first reader
- **Profile** — Your own view: what's in your hands, what's coming to you

## How location works

A book's current location is **not stored**. It is derived from the newest row in
an append-only `handoffs` log:

```
handoffs(id, book_id, from_friend, to_friend, happened_at)
```

Passing a book on appends a leg; it never overwrites the last one. That's what
makes travel history possible — "this copy has visited 3 cities over 94 days"
is a query over the log, not a field someone has to maintain. `from_friend` is
null for the leg that first put a book into circulation.

Reading status lives on the `reading_queue` table, keyed by (book, friend),
rather than on the friend — the same person can be reading one copy while
waiting on another.

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- A compatible device or simulator (iOS/Android)

### Install Dependencies

```bash
npm install
```

### Run the App

```bash
# Start the Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   └── BookCard.tsx           # Book summary card component
├── screens/
│   ├── HomeScreen.tsx         # Main book list view
│   ├── BookDetailScreen.tsx   # Book journey and history
│   ├── FriendsScreen.tsx      # Reading circle management
│   ├── AddBookScreen.tsx      # Add/assign book form
│   └── ProfileScreen.tsx      # Reading stats
├── data/
│   └── mockData.ts            # Sample books and friends
├── lib/
│   ├── supabase.ts            # Supabase client setup
│   ├── bookClubService.ts     # Row mappers + data layer with mock fallback
│   └── bookState.ts           # Derives location/next stop/history from the log
├── theme.ts                   # App colors and styling
└── types.ts                   # TypeScript definitions
```

## Database Schema

The app uses Supabase for backend storage. Key tables:

- **books** — title, author, cover color, status
- **friends** — members of the reading circle (name, location, contact)
- **reading_queue** — the order a book travels, plus each reader's progress
- **handoffs** — the append-only journey log that current location derives from

There's also a `book_current_location` view for ad-hoc queries, which the app
recomputes client-side.

Row-level security (RLS) policies enable anyone to view and add data (demo
mode). `handoffs` is granted insert but deliberately **no** update or delete, so
history can't be rewritten from the client.

Supabase returns `snake_case`; the app speaks `camelCase`. Every row crosses
that boundary through an explicit mapper in `src/lib/bookClubService.ts` —
casting a raw row to `Book` compiles but lies, and the mismatch only shows up at
runtime.

### Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (structure only, safe to re-run).
3. Seed it:
   - `supabase/seed.example.sql` — fictional demo circle, committed
   - `supabase/seed.local.sql` — your real circle; **gitignored**, create it by
     copying the example
4. Copy `.env.example` to `.env` and fill in your project URL and anon key.

The app loads real data when configured, and falls back to the fictional mock
data in `src/data/mockData.ts` otherwise.

### Keeping real names out of the repo

This repository is public. Real names, cities, and emails belong only in
Supabase, never in a committed file. Two rules enforce that:

- `src/data/mockData.ts` is the offline fallback and is **always fictional**
- anything matching `*.local.sql` is gitignored

### Security status

The policies in `schema.sql` are **demo-open**: they allow anyone to read and
write every row. The anon key is prefixed `EXPO_PUBLIC_`, so it is compiled into
the client bundle — an open policy plus a published key means the data is
effectively public.

Until Supabase Auth is wired up, treat the database as semi-public: fine for
book titles and first names, not for addresses or emails. Once auth exists,
apply `supabase/policies-authenticated.sql` to require a signed-in user.

## Styling

The app uses a warm, neutral palette designed to feel tactile and thoughtful:

- **Background** — `#f7f1ea` (warm paper)
- **Card** — `#fffdfb` (off-white)
- **Text** — `#1f1a17` (near-black)
- **Muted** — `#54473f` (taupe)
- **Accent** — `#7a5c48` (warm brown)
- **Border** — `#eaded3`
- **Soft** — `#f0e5dc` (light beige)

## Tech Stack

- **React Native** — cross-platform UI
- **Expo** — development and deployment
- **React Navigation** — tab and stack navigation
- **TypeScript** — type safety
- **Supabase** — backend and auth
- **Ionicons** — tab bar icons

## Future Ideas

- Real auth, replacing the "I am ___" picker on Profile
- Push notifications when a book is passed to you
- Reader notes attached to a handoff leg (margin notes, per stop)
- A map of everywhere a copy has been
- Analytics on which books travel the most
- Integration with Goodreads for book metadata

## License

MIT
