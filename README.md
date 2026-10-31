# The Traveling Books

One copy of a book travels around a group of friends, one reader at a time. Live at https://itang1.github.io/book-club.

## Run

```bash
npm install
npm start          # uses .env (see .env.example); without it, the demo group
npm run demo       # demo group with a dev bar to switch people
npm test
npm run typecheck
supabase/tests/run.sh   # access rules, against a local Postgres
```

## Layout

```
App.tsx          navigation
src/screens/     screens
src/components/  UI pieces
src/lib/         state, rules, Supabase
src/data/        demo and sample groups (npm run sample:sql writes supabase/sample.sql)
supabase/        schema, sample data, edge functions, tests
scripts/icons.js renders the icons from assets/*.svg (npm run icons)
```

## Deploy

Every push to `main` runs the database tests, applies `supabase/schema.sql` and `sample.sql`, deploys the edge functions, and publishes to GitHub Pages (`.github/workflows/deploy-web.yml`). `backup.yml` takes a nightly encrypted dump.

Repo secrets: `SUPABASE_DB_URL` (Session pooler), `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `SMTP_USER`, `SMTP_PASS` (Gmail app password), `GEMINI_API_KEY` (shelf scanning), `BACKUP_PASSPHRASE`.

Supabase setup: allow `https://itang1.github.io/book-club/**` under Auth → URL Configuration, and add a database webhook on `notifications` inserts that calls the `notify` function.

Real names stay out of the repo: they live in Supabase and in gitignored `*.local.sql` files.

A fan homage to *The Sisterhood of the Traveling Pants* by Ann Brashares; not affiliated. MIT licensed.
