# Contributing

Thanks for helping a book find its next reader.

## Set up

```bash
nvm use            # Node 22, from .nvmrc
npm install
npm run demo       # the fictional demo, no accounts needed
```

`npm start` runs against your own Supabase project instead (see `.env.example`).

## Before you open a pull request

```bash
npm run check      # types, lint, formatting, unit tests
npm run test:db    # who can see and do what, against a local Postgres
```

CI runs both on every pull request, and builds the web app.

## How the code is laid out

- **The database is the source of truth for rules.** Anything about who can see
  or do what lives in `supabase/schema.sql` (row-level security and
  `security definer` functions) and is tested as real signed-in users in
  `supabase/tests/`. The app never relies on hiding something on screen.
- **A book's location is derived, never stored.** It is the newest row of the
  append-only `handoffs` log. Helpers in `src/lib/bookState.ts` answer "who has
  it", "who's next", "is it in the post".
- **All state and every change** goes through `src/lib/useBookClub.ts`, which
  updates the screen first and then saves, reporting a failed save.
- **Look and feel** comes from `src/theme.ts`. Use its colours, `theme.fonts.serif`
  and `theme.caps`; don't hard-code hex values in screens.
- **Sample groups** are written once in `src/data/sampleClubs.ts`. After editing,
  run `npm run sample:sql` to regenerate `supabase/sample.sql`.
- **Icons** are drawn in `assets/crest.svg` and `assets/icon.svg`; run
  `npm run icons` to render the PNGs.

## Schema changes

`schema.sql` runs on every deploy, so every statement must be safe to run again:
`create ... if not exists`, `create or replace`, `drop policy if exists` before
`create policy`. Add a test in `supabase/tests/` for any new rule.

## Style

- Prettier and ESLint settle formatting and the usual mistakes.
- Words in the app are plain and warm, and name things the way readers would.
  Full names in status lines ("With Ross Geller").
- The repo is public: real names and emails never go in it. Fictional data
  only, in `src/data/`.
