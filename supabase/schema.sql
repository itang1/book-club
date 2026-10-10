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

-- Who gave the owner this copy, if it was a gift: a name as the owner wrote
-- it, so it can be someone outside the club ("Mom").
alter table public.books add column if not exists gifted_by text;

-- A cover image from Open Library, found when the book is lent (or later by
-- its owner). Without one, the app shows the colour swatch.
alter table public.books add column if not exists cover_url text
  check (cover_url is null or cover_url like 'https://covers.openlibrary.org/%');

-- Resting copies: when the owner keeps the book home or retires it.
alter table public.books add column if not exists archived_at timestamptz;

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

-- Where the book was read on this leg: the recipient's city when it reached
-- them. Recorded on the leg, not looked up from their profile, so a reader
-- who moves later doesn't drag their past stops along with them.
--
-- received_at: books go by mail, so a leg starts when it's sent and the
-- recipient confirms with "Got it". Null means it's in the post.
--
-- Rows from before these columns existed are backfilled once, as received
-- when sent, at the reader's city at the time of the backfill.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'handoffs' and column_name = 'place_city'
  ) then
    alter table public.handoffs add column place_city text, add column place_region text;
    update public.handoffs h
    set place_city = f.city, place_region = f.state
    from public.friends f where f.id = h.to_friend;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'handoffs' and column_name = 'received_at'
  ) then
    alter table public.handoffs add column received_at timestamptz;
    update public.handoffs set received_at = happened_at;
  end if;
end $$;

-- ---------------------------------------------------------------
-- Accounts. Each person in the club is one Supabase Auth user. A row
-- without a user_id is a profile nobody has claimed yet.
-- ---------------------------------------------------------------
alter table public.friends add column if not exists user_id uuid unique
  references auth.users (id) on delete set null;

-- Never used, and readable by every member: dropped rather than left
-- around to be filled in by mistake. Email lives in auth.users.
alter table public.friends drop column if exists address;
alter table public.friends drop column if exists email;

-- When this person agreed to the Rules of the Books: the one screen everyone
-- sees once, after joining. Null until they do. Set through "edit your own
-- profile" below, so only by them.
alter table public.friends add column if not exists agreed_rules_at timestamptz;

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

-- Friend requests: a friendship starts as "pending" from whoever asked and
-- becomes "accepted" when the other person says yes. Either can delete the
-- row: decline, cancel or unfriend, all silent. Rows from before requests
-- existed were mutual already, so they're accepted.
alter table public.friendships
  add column if not exists requested_by text references public.friends (id) on delete cascade;
alter table public.friendships
  add column if not exists status text not null default 'accepted'
  check (status in ('pending', 'accepted'));

-- ---------------------------------------------------------------
-- Groups: the circles books are lent within. Every book belongs to one,
-- and only its members (plus whoever is reading or waiting for it) can see
-- it. You join by invite link; the code is in the link.
-- ---------------------------------------------------------------
create table if not exists public.groups (
  id text primary key,
  name text not null,
  created_by text references public.friends (id) on delete set null,
  invite_code text not null unique
    default substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id text not null references public.groups (id) on delete cascade,
  person_id text not null references public.friends (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, person_id)
);

alter table public.books
  add column if not exists group_id text references public.groups (id) on delete set null;

-- A sample group (supabase/sample.sql) is a look around, not a real circle:
-- everyone is added to it automatically, nobody can act in it, and sharing
-- it doesn't make real members visible to each other.
alter table public.groups add column if not exists is_sample boolean not null default false;

-- The made-up people who live in a sample group. Marked explicitly, because
-- "no account yet" also describes real people who haven't signed in, and
-- those must stay hidden from strangers.
alter table public.friends add column if not exists is_character boolean not null default false;

-- Who can send this person a friend request: people they share a group with
-- (the default), or nobody.
alter table public.friends add column if not exists friend_requests_from text not null default 'groups'
  check (friend_requests_from in ('groups', 'nobody'));

-- Once, when groups first arrive: everyone already here becomes one group,
-- "Our Book Club", and every existing book belongs to it. Skipped on an
-- empty database, where the seeds make their own.
do $$
begin
  if not exists (select 1 from public.groups) and exists (select 1 from public.friends) then
    insert into public.groups (id, name) values ('group-club', 'Our Book Club');
    insert into public.group_members (group_id, person_id)
    select 'group-club', id from public.friends;
    update public.books set group_id = 'group-club' where group_id is null;
  end if;
end $$;

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
  public.friendships, public.groups, public.group_members in access exclusive mode;

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
-- Who can see what. security definer so the policies below can ask without
-- tripping over each other's row security; each answers only about you.
-- ---------------------------------------------------------------
create or replace function public.is_sample_group(p_group_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_sample from public.groups where id = p_group_id), false)
$$;

create or replace function public.is_sample_book(p_book_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select g.is_sample from public.books b join public.groups g on g.id = b.group_id
    where b.id = p_book_id
  ), false)
$$;

create or replace function public.is_character(p_person_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_character from public.friends where id = p_person_id), false)
$$;

-- Whether this person takes friend requests at all.
create or replace function public.accepts_requests(p_person_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select friend_requests_from = 'groups' from public.friends where id = p_person_id), false)
$$;

-- Someone who has signed in at least once, as opposed to a profile nobody
-- has claimed yet (or a sample character, who never will).
create or replace function public.has_account(p_person_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.friends where id = p_person_id and user_id is not null)
$$;

create or replace function public.is_member(p_group_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and person_id = public.me()
  )
$$;

-- A book: its group's members, plus anyone in its line (which includes its
-- owner and whoever has had it), plus whoever it's on its way to.
create or replace function public.can_see_book(p_book_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.books b
    where b.id = p_book_id and public.is_member(b.group_id)
  ) or exists (
    select 1 from public.reading_queue
    where book_id = p_book_id and friend_id = public.me()
  ) or exists (
    select 1 from public.handoffs
    where book_id = p_book_id and to_friend = public.me()
  )
$$;

-- A person: yourself, anyone you share a group with, anyone you're friends
-- with or have a request with, and anyone on a book you can see.
create or replace function public.can_see_person(p_person_id text) returns boolean
language sql stable security definer set search_path = public
as $$
  select p_person_id = public.me()
  or exists (
    select 1 from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    join public.groups g on g.id = mine.group_id and not g.is_sample
    where mine.person_id = public.me() and theirs.person_id = p_person_id
  ) or exists (
    select 1 from public.friendships
    where public.me() in (friend_a, friend_b) and p_person_id in (friend_a, friend_b)
  ) or exists (
    select 1 from public.reading_queue
    where friend_id = p_person_id and public.can_see_book(book_id)
  ) or exists (
    select 1 from public.handoffs
    where p_person_id in (to_friend, from_friend) and public.can_see_book(book_id)
  )
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
  public.friendships, public.groups, public.group_members, public.book_current_location
  from anon, authenticated;

grant usage on schema public to authenticated;

grant select, insert, update on public.friends to authenticated;
grant select on public.books to authenticated;
-- Delete exists only so a waiting reader can leave the line.
grant select, insert, update, delete on public.reading_queue to authenticated;
-- No insert, update or delete on handoffs at all: the journey log is written
-- only by pass_on() and lend_book(), and history can't be rewritten.
grant select on public.handoffs to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
-- Groups are created, joined and left through functions only.
grant select on public.groups, public.group_members to authenticated;
grant select on public.book_current_location to authenticated;

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table public.friends enable row level security;
alter table public.books enable row level security;
alter table public.reading_queue enable row level security;
alter table public.handoffs enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

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

-- Reading: what you can see is decided by groups (see can_see_book and
-- can_see_person above). Strangers see nothing of each other.
drop policy if exists "members read people" on public.friends;
drop policy if exists "see people you share something with" on public.friends;
create policy "see people you share something with"
  on public.friends for select to authenticated using (public.can_see_person(id));
drop policy if exists "members read books" on public.books;
drop policy if exists "see books in your groups" on public.books;
create policy "see books in your groups"
  on public.books for select to authenticated using (public.can_see_book(id));
drop policy if exists "members read lines" on public.reading_queue;
drop policy if exists "see lines for books you can see" on public.reading_queue;
create policy "see lines for books you can see"
  on public.reading_queue for select to authenticated using (public.can_see_book(book_id));
drop policy if exists "members read journeys" on public.handoffs;
drop policy if exists "see journeys for books you can see" on public.handoffs;
create policy "see journeys for books you can see"
  on public.handoffs for select to authenticated using (public.can_see_book(book_id));
drop policy if exists "members read friendships" on public.friendships;
drop policy if exists "see friendships among people you can see" on public.friendships;
create policy "see friendships among people you can see"
  on public.friendships for select to authenticated
  using (public.can_see_person(friend_a) and public.can_see_person(friend_b));
drop policy if exists "see your groups" on public.groups;
create policy "see your groups"
  on public.groups for select to authenticated using (public.is_member(id));
drop policy if exists "see who is in your groups" on public.group_members;
create policy "see who is in your groups"
  on public.group_members for select to authenticated
  using (
    public.is_member(group_id)
    -- In a sample group you see its characters and yourself, never the
    -- other real people looking around it.
    and (
      not public.is_sample_group(group_id)
      or person_id = public.me()
      or public.is_character(person_id)
    )
  );

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
  with check (
    friend_id = public.me() and status = 'waiting'
    and public.can_see_book(book_id) and not public.is_sample_book(book_id)
  );
drop policy if exists "manage your own place in line" on public.reading_queue;
create policy "manage your own place in line"
  on public.reading_queue for update to authenticated
  using (friend_id = public.me())
  with check (friend_id = public.me() and status in ('waiting', 'done'));
drop policy if exists "leave a line while waiting" on public.reading_queue;
create policy "leave a line while waiting"
  on public.reading_queue for delete to authenticated
  using (friend_id = public.me() and status = 'waiting');

-- Friend requests. You can ask someone you can already see (a groupmate,
-- or someone on a shared book); they accept; either of you can delete the
-- row (decline, cancel, unfriend), and nobody is told.
drop policy if exists "befriend as yourself" on public.friendships;
drop policy if exists "ask to be friends" on public.friendships;
create policy "ask to be friends"
  on public.friendships for insert to authenticated
  with check (
    requested_by = public.me()
    and status = 'pending'
    and public.me() in (friend_a, friend_b)
    and public.can_see_person(case when friend_a = public.me() then friend_b else friend_a end)
    and public.has_account(case when friend_a = public.me() then friend_b else friend_a end)
    and public.accepts_requests(case when friend_a = public.me() then friend_b else friend_a end)
  );
drop policy if exists "accept a request" on public.friendships;
create policy "accept a request"
  on public.friendships for update to authenticated
  using (public.me() in (friend_a, friend_b) and requested_by <> public.me() and status = 'pending')
  with check (status = 'accepted');
drop policy if exists "decline, cancel or unfriend" on public.friendships;
create policy "decline, cancel or unfriend"
  on public.friendships for delete to authenticated
  using (public.me() in (friend_a, friend_b));

-- ---------------------------------------------------------------
-- Writes that touch several tables, as functions: each checks who you are,
-- and all their steps succeed or fail together.
-- ---------------------------------------------------------------

-- Link the signed-in account to its profile.
--   claim_profile()                    → your profile's id, or null if none
--   claim_profile('friend-x', 'code')  → claim that profile ("That's me")
-- You can only claim a profile in a group you were invited to (the code
-- from the invite link), only while no account has it, and an account only
-- ever holds one profile.
drop function if exists public.claim_profile();
drop function if exists public.claim_profile(text);
create or replace function public.claim_profile(
  p_person_id text default null, p_invite_code text default null
) returns text
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

  update public.friends f set user_id = auth.uid()
  where f.id = p_person_id and f.user_id is null
    and exists (
      select 1 from public.group_members m join public.groups g on g.id = m.group_id
      where m.person_id = f.id and g.invite_code = p_invite_code and not g.is_sample
    )
  returning f.id into person;

  if person is null then
    raise exception 'That profile has already been claimed, or isn''t in this group';
  end if;

  return person;
end;
$$;

-- Who's in the group you were invited to but hasn't signed in yet: the
-- "Already in the club? That's me" list. Only with the invite code.
create or replace function public.unclaimed_in_group(p_invite_code text)
returns table (id text, name text, city text)
language sql stable security definer set search_path = public
as $$
  select f.id, f.name, f.city
  from public.friends f
  join public.group_members m on m.person_id = f.id
  join public.groups g on g.id = m.group_id
  where g.invite_code = p_invite_code and f.user_id is null and not g.is_sample
  order by f.name
$$;

-- The name behind an invite code, for "You're invited to Our Book Club".
create or replace function public.group_preview(p_invite_code text)
returns table (id text, name text, members integer)
language sql stable security definer set search_path = public
as $$
  select g.id, g.name, (select count(*)::int from public.group_members m where m.group_id = g.id)
  from public.groups g where g.invite_code = p_invite_code
$$;

-- Start a group, with you in it.
create or replace function public.create_group(p_group_id text, p_name text) returns text
language plpgsql security definer set search_path = public
as $$
declare
  me_id text := public.me();
begin
  if me_id is null then
    raise exception 'Make your profile before starting a group';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception 'A group needs a name';
  end if;

  insert into public.groups (id, name, created_by) values (p_group_id, trim(p_name), me_id);
  insert into public.group_members (group_id, person_id) values (p_group_id, me_id);
  return p_group_id;
end;
$$;

-- Join from an invite link. Following the link is the yes.
create or replace function public.join_group(p_invite_code text) returns text
language plpgsql security definer set search_path = public
as $$
declare
  me_id text := public.me();
  target text;
begin
  select id into target from public.groups where invite_code = p_invite_code;
  if me_id is null or target is null then
    raise exception 'That invite link doesn''t work';
  end if;

  insert into public.group_members (group_id, person_id) values (target, me_id)
  on conflict do nothing;
  return target;
end;
$$;

-- Leave a group. Books you're already reading or waiting for stay visible
-- to you through the line; you just stop seeing the rest.
create or replace function public.leave_group(p_group_id text) returns void
language sql security definer set search_path = public
as $$
  delete from public.reading_queue q
  using public.books b
  where q.book_id = b.id and b.group_id = p_group_id
    and q.friend_id = public.me() and q.status = 'waiting';
  delete from public.group_members where group_id = p_group_id and person_id = public.me();
$$;

-- Everyone is in the sample group(s) from the start, so a new member has
-- a group with some history to look around before their own is busy.
create or replace function public.join_sample_groups() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.group_members (group_id, person_id)
  select id, new.id from public.groups where is_sample
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists join_sample_groups on public.friends;
create trigger join_sample_groups
  after insert on public.friends
  for each row execute function public.join_sample_groups();

-- Put one of your own copies into circulation, starting with you, in one
-- of your groups.
drop function if exists public.lend_book(text, text, text, text, text);
drop function if exists public.lend_book(text, text, text, text, text, text);
drop function if exists public.lend_book(text, text, text, text, text, text, text);
create or replace function public.lend_book(
  p_book_id text, p_title text, p_author text, p_cover_color text, p_handoff_id text,
  p_gifted_by text default null, p_group_id text default null, p_cover_url text default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  owner public.friends;
begin
  select * into owner from public.friends where id = public.me();
  if owner.id is null then
    raise exception 'Make your profile before lending a book';
  end if;
  if p_group_id is null or not public.is_member(p_group_id) or public.is_sample_group(p_group_id) then
    raise exception 'Pick one of your groups to lend it to';
  end if;

  insert into public.books (id, title, author, cover_color, gifted_by, group_id, cover_url)
  values (p_book_id, p_title, p_author, p_cover_color, nullif(trim(p_gifted_by), ''), p_group_id,
          p_cover_url);
  insert into public.reading_queue (book_id, friend_id, position, status)
  values (p_book_id, owner.id, 0, 'reading');
  insert into public.handoffs
    (id, book_id, from_friend, to_friend, received_at, place_city, place_region)
  values (p_handoff_id, p_book_id, null, owner.id, now(), owner.city, owner.state);
end;
$$;

-- Set or clear a book's cover. Only its owner (the first leg went to them).
create or replace function public.set_cover(p_book_id text, p_cover_url text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.handoffs
    where book_id = p_book_id and from_friend is null and to_friend = public.me()
  ) then
    raise exception 'Only the book''s owner can change its cover';
  end if;

  update public.books set cover_url = p_cover_url where id = p_book_id;
end;
$$;

-- Update a book's title and author (owner only).
create or replace function public.update_book(p_book_id text, p_title text, p_author text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.handoffs
    where book_id = p_book_id and from_friend is null and to_friend = public.me()
  ) then
    raise exception 'Only the book''s owner can edit its details';
  end if;

  update public.books
  set title = trim(p_title), author = trim(p_author)
  where id = p_book_id;
end;
$$;

-- Rest a book on the home shelf (owner only).
create or replace function public.retire_book(p_book_id text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.handoffs
    where book_id = p_book_id and from_friend is null and to_friend = public.me()
  ) then
    raise exception 'Only the book''s owner can rest this copy';
  end if;
  -- Resting hides the book's actions, so a reader still holding it couldn't send it home.
  if not exists (
    select 1 from (
      select to_friend, from_friend, received_at from public.handoffs
      where book_id = p_book_id order by happened_at desc limit 1
    ) latest
    where latest.to_friend = public.me()
      and (latest.from_friend is null or latest.received_at is not null)
  ) then
    raise exception 'Rest this copy once it''s back home with you';
  end if;

  update public.books set archived_at = now() where id = p_book_id;
end;
$$;

-- Send the book you're holding to the next reader in line, or home to its
-- owner, with an optional letter. It's in the post until they say Got it.
create or replace function public.pass_on(
  p_handoff_id text, p_book_id text, p_to text, p_note text, p_rating smallint
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  me_id text := public.me();
  latest public.handoffs;
  owner text;
  recipient public.friends;
begin
  select * into latest from public.handoffs
  where book_id = p_book_id order by happened_at desc limit 1;
  select to_friend into owner from public.handoffs
  where book_id = p_book_id order by happened_at asc limit 1;
  select * into recipient from public.friends where id = p_to;

  if me_id is null or latest.to_friend is distinct from me_id then
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

  -- Passing it on means you had it, even if you never tapped Got it.
  update public.handoffs set received_at = coalesce(received_at, now())
  where id = latest.id;

  insert into public.handoffs
    (id, book_id, from_friend, to_friend, note, rating, place_city, place_region)
  values (p_handoff_id, p_book_id, me_id, p_to, nullif(trim(p_note), ''), p_rating,
          recipient.city, recipient.state);
  update public.reading_queue set status = 'done'
  where book_id = p_book_id and friend_id = me_id;
  update public.reading_queue set status = 'reading'
  where book_id = p_book_id and friend_id = p_to and status = 'waiting';
end;
$$;

-- "Got it": the book that was posted to you has arrived. The one change ever
-- made to a leg after it's written, and only once: it stamps the arrival
-- and where you are now, which is where you'll read it.
create or replace function public.mark_received(p_book_id text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  reader public.friends;
  latest public.handoffs;
begin
  select * into reader from public.friends where id = public.me();
  select * into latest from public.handoffs
  where book_id = p_book_id order by happened_at desc limit 1;

  if reader.id is null or latest.to_friend is distinct from reader.id then
    raise exception 'This book isn''t on its way to you';
  end if;

  update public.handoffs
  set received_at = now(), place_city = reader.city, place_region = reader.state
  where id = latest.id and received_at is null;
end;
$$;

revoke all on function public.me(), public.is_member(text), public.can_see_book(text),
  public.is_sample_group(text), public.is_sample_book(text), public.has_account(text),
  public.is_character(text), public.accepts_requests(text),
  public.can_see_person(text), public.claim_profile(text, text),
  public.unclaimed_in_group(text), public.group_preview(text),
  public.create_group(text, text), public.join_group(text), public.leave_group(text),
  public.lend_book(text, text, text, text, text, text, text, text),
  public.set_cover(text, text),
  public.update_book(text, text, text),
  public.retire_book(text),
  public.pass_on(text, text, text, text, smallint),
  public.mark_received(text)
  from public, anon;
grant execute on function public.me(), public.is_member(text), public.can_see_book(text),
  public.is_sample_group(text), public.is_sample_book(text), public.has_account(text),
  public.is_character(text), public.accepts_requests(text),
  public.can_see_person(text), public.claim_profile(text, text),
  public.unclaimed_in_group(text), public.group_preview(text),
  public.create_group(text, text), public.join_group(text), public.leave_group(text),
  public.lend_book(text, text, text, text, text, text, text, text),
  public.set_cover(text, text),
  public.update_book(text, text, text),
  public.retire_book(text),
  public.pass_on(text, text, text, text, smallint),
  public.mark_received(text)
  to authenticated;

-- Someone opening an invite link isn't signed in yet, so the sign-in screen
-- can say "You're invited to Living Room". Only by invite code, and only the
-- name and member count; nothing else is open to anonymous visitors.
grant execute on function public.group_preview(text) to anon;

-- ---------------------------------------------------------------
-- Email. Which emails each person wants (all on by default; they change
-- them under You → Emails), and an outbox the database fills when
-- something worth an email happens. A Supabase Edge Function
-- (supabase/functions/notify) sends what's in the outbox and stamps it
-- sent. Nobody can read or write the outbox through the API.
-- ---------------------------------------------------------------
alter table public.friends
  add column if not exists email_book_sent boolean not null default true,
  add column if not exists email_book_arrived boolean not null default true,
  add column if not exists email_next_in_line boolean not null default true,
  add column if not exists email_friend_request boolean not null default true;

create table if not exists public.notifications (
  id bigserial primary key,
  person_id text not null references public.friends (id) on delete cascade,
  kind text not null check (kind in ('book_sent', 'book_arrived', 'next_in_line', 'friend_request')),
  book_id text references public.books (id) on delete cascade,
  about_person text references public.friends (id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error text
);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;

-- Queue one email, if this person has an account (characters and unclaimed
-- profiles have no inbox) and wants this kind.
create or replace function public.notify(
  p_person text, p_kind text, p_book text, p_about text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  wants boolean;
begin
  select case p_kind
    when 'book_sent' then email_book_sent
    when 'book_arrived' then email_book_arrived
    when 'next_in_line' then email_next_in_line
    when 'friend_request' then email_friend_request
    when 'new_book' then email_new_book
  end into wants
  from public.friends
  where id = p_person and user_id is not null and not is_character;

  if coalesce(wants, false) then
    insert into public.notifications (person_id, kind, book_id, about_person)
    values (p_person, p_kind, p_book, p_about);
  end if;
end;
$$;
revoke all on function public.notify(text, text, text, text) from public, anon, authenticated;

-- A book was sent: tell the person it's coming to.
create or replace function public.on_handoff_sent() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.from_friend is not null then
    perform public.notify(new.to_friend, 'book_sent', new.book_id, new.from_friend);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_book_sent on public.handoffs;
create trigger notify_book_sent after insert on public.handoffs
  for each row execute function public.on_handoff_sent();

-- It arrived ("Got it"): tell whoever sent it, and whoever is next in line
-- that they're up after this.
create or replace function public.on_handoff_received() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  next_person text;
begin
  if old.received_at is null and new.received_at is not null and new.from_friend is not null then
    perform public.notify(new.from_friend, 'book_arrived', new.book_id, new.to_friend);

    select friend_id into next_person from public.reading_queue
    where book_id = new.book_id and status = 'waiting' and friend_id <> new.to_friend
    order by position limit 1;
    if next_person is not null then
      perform public.notify(next_person, 'next_in_line', new.book_id, new.to_friend);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_book_received on public.handoffs;
create trigger notify_book_received after update of received_at on public.handoffs
  for each row execute function public.on_handoff_received();

-- Someone asked to be friends: tell the person they asked.
create or replace function public.on_friend_request() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'pending' then
    perform public.notify(
      case when new.friend_a = new.requested_by then new.friend_b else new.friend_a end,
      'friend_request', null, new.requested_by
    );
  end if;
  return new;
end;
$$;
drop trigger if exists notify_friend_request on public.friendships;
create trigger notify_friend_request after insert on public.friendships
  for each row execute function public.on_friend_request();

-- A new book in your group: tell the other members, so they can join the line.
alter table public.friends
  add column if not exists email_new_book boolean not null default true;
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('book_sent', 'book_arrived', 'next_in_line', 'friend_request', 'new_book'));

create or replace function public.on_book_lent() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  member text;
begin
  if new.from_friend is null then
    for member in
      select gm.person_id from public.books b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = new.book_id and gm.person_id <> new.to_friend
        and not public.is_sample_group(b.group_id)
    loop
      perform public.notify(member, 'new_book', new.book_id, new.to_friend);
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_book_lent on public.handoffs;
create trigger notify_book_lent after insert on public.handoffs
  for each row execute function public.on_book_lent();

-- ---------------------------------------------------------------
-- One-tap email buttons: Got it, Accept, Join the line. The sender
-- (supabase/functions/notify) stores a hash of a random token per button;
-- the link opens a page that confirms before redeeming, because mail
-- scanners open links on their own. Single use, 30 days, and only ever
-- the one action for the one person it was sent to.
-- ---------------------------------------------------------------
create table if not exists public.email_actions (
  token_hash text primary key,
  person_id text not null references public.friends (id) on delete cascade,
  action text not null check (action in ('got_it', 'accept_friend', 'join_line')),
  book_id text references public.books (id) on delete cascade,
  about_person text references public.friends (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
alter table public.email_actions enable row level security;
revoke all on public.email_actions from anon, authenticated;

create or replace function public.email_action_hash(p_token text) returns text
language sql immutable
as $$ select encode(sha256(convert_to(p_token, 'UTF8')), 'hex') $$;

-- What a link is for, so the page can ask before doing it. Whoever holds
-- the link sees the book title and a first name, nothing more.
create or replace function public.email_action_preview(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  a public.email_actions;
begin
  select * into a from public.email_actions where token_hash = public.email_action_hash(p_token);
  if a.token_hash is null then
    return jsonb_build_object('state', 'unknown');
  end if;
  return jsonb_build_object(
    'state', case
      when a.used_at is not null then 'used'
      when a.created_at < now() - interval '30 days' then 'expired'
      else 'ready' end,
    'action', a.action,
    'bookId', a.book_id,
    'title', (select title from public.books where id = a.book_id),
    'about', (select split_part(name, ' ', 1) from public.friends where id = a.about_person)
  );
end;
$$;

-- Do it, as the person the email went to. 'done' when it happened now,
-- 'already' when there was nothing left to do (it arrived, they're in line).
create or replace function public.redeem_email_action(p_token text) returns text
language plpgsql security definer set search_path = public
as $$
declare
  a public.email_actions;
  reader public.friends;
  latest public.handoffs;
  b public.books;
  changed boolean := false;
begin
  select * into a from public.email_actions
  where token_hash = public.email_action_hash(p_token) for update;
  if a.token_hash is null then
    return 'unknown';
  end if;
  if a.used_at is not null then
    return 'already';
  end if;
  if a.created_at < now() - interval '30 days' then
    return 'expired';
  end if;

  if a.action = 'got_it' then
    select * into reader from public.friends where id = a.person_id;
    select * into latest from public.handoffs
    where book_id = a.book_id order by happened_at desc limit 1;
    if latest.to_friend = reader.id and latest.received_at is null then
      update public.handoffs
      set received_at = now(), place_city = reader.city, place_region = reader.state
      where id = latest.id;
      changed := true;
    end if;

  elsif a.action = 'accept_friend' then
    update public.friendships set status = 'accepted'
    where friend_a = least(a.person_id, a.about_person)
      and friend_b = greatest(a.person_id, a.about_person)
      and requested_by = a.about_person and status = 'pending';
    changed := found;

  elsif a.action = 'join_line' then
    select * into b from public.books where id = a.book_id;
    select * into latest from public.handoffs
    where book_id = a.book_id order by happened_at desc limit 1;
    if exists (select 1 from public.group_members where group_id = b.group_id and person_id = a.person_id)
       and not public.is_sample_group(b.group_id)
       and latest.to_friend is distinct from a.person_id then
      insert into public.reading_queue (book_id, friend_id, position, status)
      values (a.book_id, a.person_id,
              (select coalesce(max(position), -1) + 1 from public.reading_queue where book_id = a.book_id),
              'waiting')
      on conflict (book_id, friend_id) do update
        set status = 'waiting', position = excluded.position
        where public.reading_queue.status = 'done';
      changed := found;
    end if;
  end if;

  update public.email_actions set used_at = now() where token_hash = a.token_hash;
  return case when changed then 'done' else 'already' end;
end;
$$;

revoke all on function public.email_action_preview(text), public.redeem_email_action(text)
  from public;
grant execute on function public.email_action_preview(text), public.redeem_email_action(text)
  to anon, authenticated;

-- ---------------------------------------------------------------
-- Tell the API about any new tables or columns straight away, rather than
-- waiting for it to notice ("not in the schema cache" errors otherwise).
-- ---------------------------------------------------------------
notify pgrst, 'reload schema';
