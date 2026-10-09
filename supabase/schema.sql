-- Sisterhood of the Traveling Books — Supabase schema (structure only)
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
-- WHO CAN DO WHAT
--
-- Everything requires signing in (Supabase Auth). Anonymous visitors, who
-- hold the anon key compiled into the public app, can read and write
-- nothing.
--
-- Signed in, you can read the club and write only as yourself: your own
-- profile, your own place in a line, friendships you're part of. Lending a
-- book and passing one on go through the functions at the bottom of this
-- file, which check that you own the book or are holding it.
--
-- Each person is linked to an account by friends.user_id. Someone already
-- in the club claims their profile on first sign-in ("That's me"); someone
-- new makes one. See claim_profile().
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
-- Book status is derived from the handoff log in the app; storing it let the
-- two drift apart.
drop index if exists public.books_status_idx;
alter table if exists public.books drop column if exists status;

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
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Reading queue: who signed up for a book, in sign-up order, and each
-- reader's progress. Nobody is added automatically; a row exists because that
-- person asked for the book. Status lives on the (book, friend) edge, not on
-- the friend: one person can be reading one copy while waiting on another.
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

-- The letter the passer leaves in the book. Written once with the leg and,
-- like the leg, never edited. The app keeps it sealed from anyone who hasn't
-- finished the book yet.
alter table public.handoffs add column if not exists note text;
alter table public.handoffs add column if not exists rating smallint
  check (rating between 1 and 5);

-- ---------------------------------------------------------------
-- Accounts. Each person in the club is one Supabase Auth user. A row
-- without a user_id is a profile nobody has claimed yet.
-- ---------------------------------------------------------------
alter table public.friends add column if not exists user_id uuid unique
  references auth.users (id) on delete set null;

-- Retired: an email-to-profile table that had to be filled in by hand before
-- anyone could sign in. Claiming is now done in the app.
drop table if exists public.profile_claims;

-- ---------------------------------------------------------------
-- Friendships: who is friends with whom. `friends` is everyone in the club;
-- this is the graph between them. One row per pair, stored with the smaller
-- id first so (a, b) and (b, a) can't both exist. Mutual by design: adding a
-- friend befriends both ways.
-- ---------------------------------------------------------------
create table if not exists public.friendships (
  friend_a text not null references public.friends (id) on delete cascade,
  friend_b text not null references public.friends (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (friend_a, friend_b),
  check (friend_a < friend_b)
);

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
-- Everything below rewrites access rules, which briefly locks each table.
-- Taking all the locks at once, up front, means the app's own reads simply
-- wait a moment instead of deadlocking against a half-finished rewrite.
-- ---------------------------------------------------------------
lock table public.friends, public.books, public.reading_queue, public.handoffs,
  public.friendships in access exclusive mode;

-- ---------------------------------------------------------------
-- Who am I? The club member linked to the signed-in account, or null.
-- security definer so policies can call it without tripping over the RLS on
-- friends; it only ever returns the caller's own id.
-- ---------------------------------------------------------------
create or replace function public.me() returns text
language sql stable security definer set search_path = public
as $$
  select id from public.friends where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------
-- Data API privileges
--
-- Table grants and RLS are two separate layers: a grant opens the door, RLS
-- decides which rows come back. Both must allow an operation.
--
-- Everything is revoked first and granted back precisely, because Supabase
-- grants new tables to anon and authenticated by default. The anon role
-- gets nothing at all.
-- ---------------------------------------------------------------
revoke all on public.friends, public.books, public.reading_queue, public.handoffs,
  public.friendships, public.book_current_location
  from anon, authenticated;

grant usage on schema public to authenticated;

grant select, insert, update on public.friends to authenticated;
grant select on public.books to authenticated;
-- Delete exists only so a waiting reader can leave the line.
grant select, insert, update, delete on public.reading_queue to authenticated;
-- No insert, update or delete on handoffs at all: the journey log is written
-- only by pass_on() and lend_book(), and history can't be rewritten.
grant select on public.handoffs to authenticated;
grant select, insert on public.friendships to authenticated;
grant select on public.book_current_location to authenticated;

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table public.friends enable row level security;
alter table public.books enable row level security;
alter table public.reading_queue enable row level security;
alter table public.handoffs enable row level security;
alter table public.friendships enable row level security;

-- Retire every earlier policy: the demo-open ones and the ones from the old
-- policies-authenticated.sql.
drop policy if exists "friends are viewable by everyone" on public.friends;
drop policy if exists "anyone can add a friend" on public.friends;
drop policy if exists "signed-in users can read friends" on public.friends;
drop policy if exists "signed-in users can add friends" on public.friends;
drop policy if exists "signed-in users can update friends" on public.friends;
drop policy if exists "books are viewable by everyone" on public.books;
drop policy if exists "anyone can add a book" on public.books;
drop policy if exists "anyone can update a book" on public.books;
drop policy if exists "signed-in users can read books" on public.books;
drop policy if exists "signed-in users can add books" on public.books;
drop policy if exists "signed-in users can update books" on public.books;
drop policy if exists "queue is viewable by everyone" on public.reading_queue;
drop policy if exists "anyone can add to the queue" on public.reading_queue;
drop policy if exists "anyone can update the queue" on public.reading_queue;
drop policy if exists "waiting readers can leave the queue" on public.reading_queue;
drop policy if exists "signed-in users can read the queue" on public.reading_queue;
drop policy if exists "signed-in users can add to the queue" on public.reading_queue;
drop policy if exists "signed-in users can update the queue" on public.reading_queue;
drop policy if exists "signed-in users can leave the queue while waiting" on public.reading_queue;
drop policy if exists "friendships are viewable by everyone" on public.friendships;
drop policy if exists "anyone can add a friendship" on public.friendships;
drop policy if exists "signed-in users can read friendships" on public.friendships;
drop policy if exists "signed-in users can add friendships" on public.friendships;
drop policy if exists "handoffs are viewable by everyone" on public.handoffs;
drop policy if exists "anyone can record a handoff" on public.handoffs;
drop policy if exists "signed-in users can read handoffs" on public.handoffs;
drop policy if exists "signed-in users can record a handoff" on public.handoffs;

-- Reading: anyone signed in sees the whole club, for now. Groups will
-- narrow this (docs/groups-and-privacy.md).
drop policy if exists "members read people" on public.friends;
create policy "members read people"
  on public.friends for select to authenticated using (true);
drop policy if exists "members read books" on public.books;
create policy "members read books"
  on public.books for select to authenticated using (true);
drop policy if exists "members read lines" on public.reading_queue;
create policy "members read lines"
  on public.reading_queue for select to authenticated using (true);
drop policy if exists "members read journeys" on public.handoffs;
create policy "members read journeys"
  on public.handoffs for select to authenticated using (true);
drop policy if exists "members read friendships" on public.friendships;
create policy "members read friendships"
  on public.friendships for select to authenticated using (true);

-- Your profile: one per account, made and edited only by you.
drop policy if exists "make your own profile" on public.friends;
create policy "make your own profile"
  on public.friends for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "edit your own profile" on public.friends;
create policy "edit your own profile"
  on public.friends for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Your place in a line: only yours, and only as "waiting" or "done".
-- "reading" is set by pass_on() when the book actually reaches you.
drop policy if exists "join a line yourself" on public.reading_queue;
create policy "join a line yourself"
  on public.reading_queue for insert to authenticated
  with check (friend_id = public.me() and status = 'waiting');
drop policy if exists "manage your own place in line" on public.reading_queue;
create policy "manage your own place in line"
  on public.reading_queue for update to authenticated
  using (friend_id = public.me())
  with check (friend_id = public.me() and status in ('waiting', 'done'));
drop policy if exists "leave a line while waiting" on public.reading_queue;
create policy "leave a line while waiting"
  on public.reading_queue for delete to authenticated
  using (friend_id = public.me() and status = 'waiting');

-- Friendships you're part of.
drop policy if exists "befriend as yourself" on public.friendships;
create policy "befriend as yourself"
  on public.friendships for insert to authenticated
  with check (public.me() in (friend_a, friend_b));

-- ---------------------------------------------------------------
-- Writes that touch several tables, as functions: each checks who you are,
-- and all their steps succeed or fail together.
-- ---------------------------------------------------------------

-- Link the signed-in account to its profile.
--   claim_profile()           → your profile's id, or null if you have none
--   claim_profile('friend-x') → claim that profile as yours ("That's me")
-- A profile can only be claimed while no account has it, and an account can
-- only ever hold one profile, so once someone has claimed theirs it's locked.
drop function if exists public.claim_profile();
create or replace function public.claim_profile(p_person_id text default null) returns text
language plpgsql security definer set search_path = public
as $$
declare
  person text;
begin
  if auth.uid() is null then
    return null;
  end if;

  select id into person from public.friends where user_id = auth.uid();
  if person is not null or p_person_id is null then
    return person;
  end if;

  update public.friends set user_id = auth.uid()
  where id = p_person_id and user_id is null
  returning id into person;

  if person is null then
    raise exception 'That profile has already been claimed';
  end if;

  return person;
end;
$$;

-- Put one of your own copies into circulation, starting with you.
create or replace function public.lend_book(
  p_book_id text, p_title text, p_author text, p_cover_color text, p_handoff_id text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  owner text := public.me();
begin
  if owner is null then
    raise exception 'Make your profile before lending a book';
  end if;

  insert into public.books (id, title, author, cover_color)
  values (p_book_id, p_title, p_author, p_cover_color);
  insert into public.reading_queue (book_id, friend_id, position, status)
  values (p_book_id, owner, 0, 'reading');
  insert into public.handoffs (id, book_id, from_friend, to_friend)
  values (p_handoff_id, p_book_id, null, owner);
end;
$$;

-- Hand the book you're holding to the next reader in line, or home to its
-- owner, with an optional letter.
create or replace function public.pass_on(
  p_handoff_id text, p_book_id text, p_to text, p_note text, p_rating smallint
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  me_id text := public.me();
  holder text;
  owner text;
begin
  select to_friend into holder from public.handoffs
  where book_id = p_book_id order by happened_at desc limit 1;
  select to_friend into owner from public.handoffs
  where book_id = p_book_id order by happened_at asc limit 1;

  if me_id is null or holder is distinct from me_id then
    raise exception 'Only the person holding a book can pass it on';
  end if;
  if p_to = me_id then
    raise exception 'You already have it';
  end if;
  if p_to is distinct from owner and not exists (
    select 1 from public.reading_queue
    where book_id = p_book_id and friend_id = p_to and status = 'waiting'
  ) then
    raise exception 'They are not in line for this book';
  end if;

  insert into public.handoffs (id, book_id, from_friend, to_friend, note, rating)
  values (p_handoff_id, p_book_id, me_id, p_to, nullif(trim(p_note), ''), p_rating);
  update public.reading_queue set status = 'done'
  where book_id = p_book_id and friend_id = me_id;
  update public.reading_queue set status = 'reading'
  where book_id = p_book_id and friend_id = p_to and status = 'waiting';
end;
$$;

revoke all on function public.me(), public.claim_profile(text),
  public.lend_book(text, text, text, text, text),
  public.pass_on(text, text, text, text, smallint)
  from public, anon;
grant execute on function public.me(), public.claim_profile(text),
  public.lend_book(text, text, text, text, text),
  public.pass_on(text, text, text, text, smallint)
  to authenticated;

-- ---------------------------------------------------------------
-- Tell the API about any new tables or columns straight away, rather than
-- waiting for it to notice ("not in the schema cache" errors otherwise).
-- ---------------------------------------------------------------
notify pgrst, 'reload schema';
