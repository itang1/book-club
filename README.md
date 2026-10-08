# The Traveling Copy

One book, many readers, a shared reading journey.

A React Native app that tracks the journey of physical books as they travel between friends in your reading circle.

## What is The Traveling Copy?

It's a simple way to follow where a book is, who has it, and how it moves over time. Instead of wondering "who has that copy of *The Secret Life of Bees*?", you just open the app.

This is a **book circulation tracker**, not a shipping app — no tracking numbers, no carriers, no parcels. Just the book, the circle, and where the copy is right now.

**The core idea:** shared copies of books travel between friends. This app is the ledger.

## Features

- **Home** — See all books currently in circulation, sorted by status
- **Book Cards** — Quick view of title, author, current owner, next stop, and status
- **Book Detail** — The reading path: who has the copy now, who's up next, and the rest of the queue
- **Friends** — Manage the reading circle (name, location, reading status)
- **Add Book** — Introduce a new traveling copy and pick its first reader
- **Profile** — Lightweight reading stats

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
│   └── bookClubService.ts     # Data layer with mock-data fallback
├── theme.ts                   # App colors and styling
└── types.ts                   # TypeScript definitions
```

## Database Schema

The app uses Supabase for backend storage. Key tables:

- **books** — book metadata, current owner, next stop, status, note count
- **friends** — members of the reading circle (name, location, reading status)
- **book_friends** — the reading queue: the order a book travels through the circle

Row-level security (RLS) policies enable anyone to view and add data (demo mode).

### Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (it is safe to re-run).
3. Copy `.env.example` to `.env` and fill in your project URL and anon key.

The app loads real data when configured, and falls back to seeded mock data otherwise.

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

- Push notifications when a book reaches you
- Shared notes within the app
- Book reading schedules
- Analytics on which books travel the most
- Export reading circle as a shareable list
- Integration with Goodreads for book metadata

## License

MIT
