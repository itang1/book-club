# Book Club — Traveling Book Tracker

A React Native app that tracks the journey of physical books as they travel between friends in your reading circle.

## What is Book Club?

Book Club is a simple way to follow where a book is, who has it, and how it moves over time. Instead of wondering "who has that copy of *The Secret Life of Bees*?", you just open the app.

**The core idea:** shared copies of books travel between friends. This app is the ledger.

## Features

- **Home** — See all books currently in circulation, sorted by status
- **Book Cards** — Quick view of title, author, current owner, next stop, and status
- **Book Detail** — Full journey and history of where a book has traveled
- **Friends** — Manage the reading circle
- **Add Book** — Introduce a new traveling copy and assign it to a friend
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
│   ├── NotesScreen.tsx        # Annotations view
│   └── ProfileScreen.tsx      # Reading stats
├── data/
│   └── mockData.ts            # Sample books and friends
├── lib/
│   └── supabase.ts            # Supabase client setup
├── theme.ts                   # App colors and styling
└── types.ts                   # TypeScript definitions
```

## Database Schema

The app uses Supabase for backend storage. Key tables:

- **books** — book metadata, current owner, status, tracking number
- **friends** — members of the reading circle with contact info
- **annotations** — notes and highlights attached to books
- **shipments** — tracking data for book transfers

Row-level security (RLS) policies enable anyone to view and add data (demo mode).

## Styling

The app uses a warm, neutral palette designed to feel tactile and thoughtful:

- **Background** — `#f7f1ea`
- **Accent** — `#7a5c48` (warm brown)
- **Card** — `#ffffff`
- **Muted** — `#8a7d76` (taupe)
- **Soft** — `#efe5dd` (light beige)

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
