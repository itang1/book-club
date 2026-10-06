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
- React Navigation
- Supabase-ready data layer
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

This version includes:
- a tab-based navigation layout for Home, Friends, Add Book, and Profile
- a home dashboard for active books
- detail view for each book and its travel timeline
- mock data for friends, book journeys, and reading activity

## Next features to build

- real data storage with Supabase
- add friend and address forms
- USPS tracking integration
- note and annotation uploads
- Goodreads-style polish and social book profiles

## Backend starter

This repo is prepared for a Supabase integration. Add your project URL and anon key to a local `.env` file or create your own secure config.

## Notes

This is a working foundation designed to grow into a real app experience.
