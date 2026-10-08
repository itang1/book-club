-- The Traveling Copy — Supabase schema
-- One book, many readers, a shared reading journey.
--
-- Run this in the Supabase SQL editor. It is safe to re-run, and safe to run
-- over an earlier version of this schema.
--
-- Design note: a book's current location is NOT stored. It is derived from the
-- newest row in `handoffs`. That keeps the journey intact instead of
-- overwriting the past every time a book moves.

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
-- Friends: the reading circle
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
create or replace view public.book_current_location as
select distinct on (h.book_id)
  h.book_id,
  h.to_friend as current_owner,
  h.happened_at as last_activity_at
from public.handoffs h
order by h.book_id, h.happened_at desc;

-- ---------------------------------------------------------------
-- Row level security (demo mode: open read + write)
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

-- ---------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------
insert into public.friends (id, name, city, state, email) values
  ('friend-1', 'Maya',  'Seattle',  'WA', 'maya@example.com'),
  ('friend-2', 'Leah',  'Austin',   'TX', 'leah@example.com'),
  ('friend-3', 'Priya', 'Boston',   'MA', 'priya@example.com'),
  ('friend-4', 'Nina',  'Chicago',  'IL', 'nina@example.com'),
  ('friend-5', 'Rina',  'New York', 'NY', 'rina@example.com')
on conflict (id) do nothing;

insert into public.books (id, title, author, cover_color, status) values
  ('book-1', 'The Secret Life of Bees', 'Sue Monk Kidd', '#d9a77d', 'reading'),
  ('book-2', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', '#b4b8a9', 'in-transit'),
  ('book-3', 'Circe', 'Madeline Miller', '#c7a6b5', 'annotated'),
  ('book-4', 'Piranesi', 'Susanna Clarke', '#93a7a5', 'returned')
on conflict (id) do nothing;

insert into public.reading_queue (book_id, friend_id, position, status) values
  ('book-1', 'friend-1', 0, 'done'),
  ('book-1', 'friend-2', 1, 'reading'),
  ('book-1', 'friend-3', 2, 'waiting'),
  ('book-1', 'friend-4', 3, 'waiting'),
  ('book-2', 'friend-5', 0, 'done'),
  ('book-2', 'friend-1', 1, 'waiting'),
  ('book-2', 'friend-2', 2, 'waiting'),
  ('book-3', 'friend-3', 0, 'done'),
  ('book-3', 'friend-5', 1, 'done'),
  ('book-3', 'friend-4', 2, 'reading'),
  ('book-4', 'friend-2', 0, 'done'),
  ('book-4', 'friend-4', 1, 'done'),
  ('book-4', 'friend-1', 2, 'done')
on conflict (book_id, friend_id) do nothing;

insert into public.handoffs (id, book_id, from_friend, to_friend, happened_at) values
  ('handoff-1a', 'book-1', null,       'friend-1', now() - interval '41 days'),
  ('handoff-1b', 'book-1', 'friend-1', 'friend-2', now() - interval '12 days'),
  ('handoff-2a', 'book-2', null,       'friend-5', now() - interval '63 days'),
  ('handoff-2b', 'book-2', 'friend-5', 'friend-1', now() - interval '5 hours'),
  ('handoff-3a', 'book-3', null,       'friend-3', now() - interval '94 days'),
  ('handoff-3b', 'book-3', 'friend-3', 'friend-5', now() - interval '38 days'),
  ('handoff-3c', 'book-3', 'friend-5', 'friend-4', now() - interval '7 days'),
  ('handoff-4a', 'book-4', null,       'friend-2', now() - interval '121 days'),
  ('handoff-4b', 'book-4', 'friend-2', 'friend-4', now() - interval '88 days'),
  ('handoff-4c', 'book-4', 'friend-4', 'friend-1', now() - interval '59 days')
on conflict (id) do nothing;
