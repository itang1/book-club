-- Sisterhood of the Traveling Book — Supabase schema (structure only)
-- One book, many readers, a shared reading journey.
--
-- Run this in the Supabase SQL editor. It is safe to re-run, and safe to run
-- over an earlier version of this schema.
--
-- Seed data lives in separate files so that no real names are committed:
--   supabase/seed.example.sql  — fictional demo group (committed)
--   supabase/seed.local.sql    — your real group (gitignored)
--
-- Design note: a book's current location is NOT stored. It is derived from the
-- newest row in `handoffs`. That keeps the journey intact instead of
-- overwriting the past every time a book moves.
--
-- ===================================================================
-- READ THIS BEFORE PUTTING REAL DATA IN
--
-- The policies at the bottom of this file are DEMO-OPEN: they let anyone
-- read and write every row. That is not merely a database setting — the
-- anon key is prefixed EXPO_PUBLIC_, so it is compiled into the client
-- bundle and visible to anyone who loads the app. Open policies plus a
-- published key means the data is effectively public.
--
-- Until Supabase Auth is wired up, treat this database as semi-public:
-- fine for titles and first names, not for addresses or emails.
-- Once auth exists, apply supabase/policies-authenticated.sql to require
-- a signed-in user.
-- ===================================================================

-- ---------------------------------------------------------------
-- Migration: retire the old shipping-era shape if it exists
-- ---------------------------------------------------------------
drop table if exists public.annotations cascade;
drop table if exists public.shipments cascade;
drop table if exists public.book_friends cascade;

alter table if exists public.books drop column if exists tracking_number;
alter table if exists public.books drop column if exists notes_count;
alter table if exists public.books drop column if exists current_owner;
alter table if exists public.books drop column if exists next_stop;
alter table if exists public.books drop column if exists last_updated;
alter table if exists public.friends drop column if exists status;

-- ---------------------------------------------------------------
-- Friends: the group
-- ---------------------------------------------------------------
create table if not exists public.friends (
  id text primary key,
  name text not null,
  city text not null,
  state text not null,
  address text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Books: copies in circulation
-- ---------------------------------------------------------------
create table if not exists public.books (
  id text primary key,
  title text not null,
  author text not null,
  cover_color text not null default '#d9a77d',
  status text not null default 'in-transit'
    check (status in ('in-transit', 'reading', 'returned', 'annotated')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Reading queue: the order a book travels, and each reader's progress.
-- Status lives on the (book, friend) edge, not on the friend: one person can
-- be reading one copy while waiting on another.
-- ---------------------------------------------------------------
create table if not exists public.reading_queue (
  book_id text not null references public.books (id) on delete cascade,
  friend_id text not null references public.friends (id) on delete cascade,
  position integer not null default 0,
  status text not null default 'waiting'
    check (status in ('waiting', 'reading', 'done')),
  primary key (book_id, friend_id)
);

-- ---------------------------------------------------------------
-- Handoffs: the append-only journey log. from_friend is null for the
-- handoff that first put a book into circulation.
-- ---------------------------------------------------------------
create table if not exists public.handoffs (
  id text primary key,
  book_id text not null references public.books (id) on delete cascade,
  from_friend text references public.friends (id) on delete set null,
  to_friend text not null references public.friends (id) on delete cascade,
  happened_at timestamptz not null default now()
);

create index if not exists books_status_idx on public.books (status);
create index if not exists reading_queue_book_idx on public.reading_queue (book_id, position);
create index if not exists handoffs_book_idx on public.handoffs (book_id, happened_at);

-- ---------------------------------------------------------------
-- Convenience view: current location per book, derived from the log.
-- The app derives this client-side too; the view is for ad-hoc queries.
-- ---------------------------------------------------------------
-- security_invoker runs the view with the *caller's* permissions. Without it a
-- view is evaluated as its owner (postgres) and silently bypasses the RLS on
-- handoffs underneath — a view becomes a hole straight through row security.
create or replace view public.book_current_location
with (security_invoker = true) as
select distinct on (h.book_id)
  h.book_id,
  h.to_friend as current_owner,
  h.happened_at as last_activity_at
from public.handoffs h
order by h.book_id, h.happened_at desc;

-- ---------------------------------------------------------------
-- Data API privileges
--
-- Table grants and RLS are two separate layers: a grant opens the door, RLS
-- decides which rows come back. Both must allow an operation.
--
-- These are written explicitly so the schema works whether or not the project
-- has "Automatically expose new tables" enabled. With that setting off, new
-- tables get no grants by default and the API returns "permission denied for
-- table" even when the RLS policies are correct. Any new table added later
-- needs its own grant here.
-- ---------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update on public.friends to anon, authenticated;
grant select, insert, update on public.books to anon, authenticated;
grant select, insert, update on public.reading_queue to anon, authenticated;

-- No update or delete on handoffs, deliberately. The journey log is
-- append-only at the privilege layer as well as the policy layer, so history
-- cannot be rewritten even if a policy is added by mistake later.
grant select, insert on public.handoffs to anon, authenticated;

grant select on public.book_current_location to anon, authenticated;

-- ---------------------------------------------------------------
-- Row level security — DEMO MODE. See the warning at the top of this file.
-- ---------------------------------------------------------------
alter table public.friends enable row level security;
alter table public.books enable row level security;
alter table public.reading_queue enable row level security;
alter table public.handoffs enable row level security;

drop policy if exists "friends are viewable by everyone" on public.friends;
create policy "friends are viewable by everyone"
  on public.friends for select using (true);

drop policy if exists "anyone can add a friend" on public.friends;
create policy "anyone can add a friend"
  on public.friends for insert with check (true);

drop policy if exists "books are viewable by everyone" on public.books;
create policy "books are viewable by everyone"
  on public.books for select using (true);

drop policy if exists "anyone can add a book" on public.books;
create policy "anyone can add a book"
  on public.books for insert with check (true);

drop policy if exists "anyone can update a book" on public.books;
create policy "anyone can update a book"
  on public.books for update using (true) with check (true);

drop policy if exists "queue is viewable by everyone" on public.reading_queue;
create policy "queue is viewable by everyone"
  on public.reading_queue for select using (true);

drop policy if exists "anyone can add to the queue" on public.reading_queue;
create policy "anyone can add to the queue"
  on public.reading_queue for insert with check (true);

drop policy if exists "anyone can update the queue" on public.reading_queue;
create policy "anyone can update the queue"
  on public.reading_queue for update using (true) with check (true);

drop policy if exists "handoffs are viewable by everyone" on public.handoffs;
create policy "handoffs are viewable by everyone"
  on public.handoffs for select using (true);

-- Insert only: the journey log is append-only by design. No update or delete
-- policy is granted, so history cannot be rewritten from the client.
drop policy if exists "anyone can record a handoff" on public.handoffs;
create policy "anyone can record a handoff"
  on public.handoffs for insert with check (true);
