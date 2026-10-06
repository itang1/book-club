# Book Club

A cross-platform app for tracking a shared book traveling across friends via USPS media mail.

## What this app is about

Book Club is a concept app for the "one copy, many readers" experience:
- a book is sent to one friend at a time
- each person reads it, annotates it, and passes it along
- the group tracks who has it, where it is, and what notes were added

This follows the spirit of a modern "Sisterhood of the Traveling Pants" style reading club.

## Tech stack

This scaffold uses:
- React Native + Expo
- TypeScript
- Web, Android, and iOS from one codebase

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

3. Run on web:
   ```bash
   npm run web
   ```

4. Run on Android/iOS:
   ```bash
   npm run android
   npm run ios
   ```

## Current MVP status

This first version includes:
- a home screen for active books
- mock book data
- book cards showing owner, next stop, notes, and last update
- a warm editorial layout that feels like a shared reading club dashboard

## Next features to build

- add friends and their addresses
- track USPS media mail shipments
- note highlights and annotations per book
- create “currently traveling” journey timelines
- login and shared reading data
- Goodreads-style polish for book profiles and shelves

## Repository goal

This project is designed to grow into a real app that could eventually be pitched for Goodreads integration or a book-club brand experience.

## Project structure

```text
.
├── App.tsx
├── src/
│   ├── components/
│   ├── data/
│   ├── theme.ts
│   └── types.ts
├── app.json
├── babel.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

This is intentionally a clean starting point, not a finished product. It’s meant to be expanded with your real data model and app flow.

---

If you want, the next step is to add:
- a friend list screen
- a book detail screen
- a shipping timeline screen
- backend storage with Supabase or Firebase
- polished mobile navigation





























































































































































































