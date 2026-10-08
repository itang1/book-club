-- The Traveling Copy — Supabase schema
-- One book, many readers, a shared reading journey.
--
-- Run this in the Supabase SQL editor. It is safe to re-run.

-- ---------------------------------------------------------------
-- Friends: the reading circle
-- ---------------------------------------------------------------
create table if not exists public.friends (
  id text primary key,
  name text not null,
  city text not null,
  state text not null,
  status text not null default 'waiting'
    check (status in ('waiting', 'reading', 'done')),
  address text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Books: copies currently in circulation
-- ---------------------------------------------------------------
create table if not exists public.books (
  id text primary key,
  title text not null,
  author text not null,
  cover_color text not null default '#d9a77d',
  status text not null default 'in-transit'
    check (status in ('in-transit', 'reading', 'returned', 'annotated')),
  current_owner text references public.friends (id) on delete set null,
  next_stop text references public.friends (id) on delete set null,
  notes_count integer not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Reading queue: the order a book travels through the circle
-- ---------------------------------------------------------------
create table if not exists public.book_friends (
  book_id text not null references public.books (id) on delete cascade,
  friend_id text not null references public.friends (id) on delete cascade,
  position integer not null default 0,
  primary key (book_id, friend_id)
);

create index if not exists books_status_idx on public.books (status);
create index if not exists book_friends_book_idx on public.book_friends (book_id, position);

-- ---------------------------------------------------------------
-- Row level security (demo mode: open read + insert)
-- ---------------------------------------------------------------
alter table public.friends enable row level security;
alter table public.books enable row level security;
alter table public.book_friends enable row level security;

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

drop policy if exists "reading queue is viewable by everyone" on public.book_friends;
create policy "reading queue is viewable by everyone"
  on public.book_friends for select using (true);

drop policy if exists "anyone can edit the reading queue" on public.book_friends;
create policy "anyone can edit the reading queue"
  on public.book_friends for insert with check (true);

-- ---------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------
insert into public.friends (id, name, city, state, status, email) values
  ('friend-1', 'Maya',  'Seattle',  'WA', 'done',    'maya@example.com'),
  ('friend-2', 'Leah',  'Austin',   'TX', 'reading', 'leah@example.com'),
  ('friend-3', 'Priya', 'Boston',   'MA', 'waiting', 'priya@example.com'),
  ('friend-4', 'Nina',  'Chicago',  'IL', 'waiting', 'nina@example.com'),
  ('friend-5', 'Rina',  'New York', 'NY', 'done',    'rina@example.com')
on conflict (id) do nothing;

insert into public.books (id, title, author, cover_color, status, current_owner, next_stop, notes_count) values
  ('book-1', 'The Secret Life of Bees', 'Sue Monk Kidd', '#d9a77d', 'reading', 'friend-2', 'friend-3', 12),
  ('book-2', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', '#b4b8a9', 'in-transit', 'friend-1', 'friend-5', 7),
  ('book-3', 'Circe', 'Madeline Miller', '#c7a6b5', 'annotated', 'friend-5', 'friend-4', 23),
  ('book-4', 'Piranesi', 'Susanna Clarke', '#93a7a5', 'returned', 'friend-3', 'friend-1', 4)
on conflict (id) do nothing;

insert into public.book_friends (book_id, friend_id, position) values
  ('book-1', 'friend-1', 0),
  ('book-1', 'friend-2', 1),
  ('book-1', 'friend-3', 2),
  ('book-1', 'friend-4', 3),
  ('book-2', 'friend-5', 0),
  ('book-2', 'friend-1', 1),
  ('book-2', 'friend-2', 2),
  ('book-3', 'friend-3', 0),
  ('book-3', 'friend-5', 1),
  ('book-3', 'friend-4', 2),
  ('book-4', 'friend-2', 0),
  ('book-4', 'friend-4', 1),
  ('book-4', 'friend-1', 2)
on conflict (book_id, friend_id) do nothing;
