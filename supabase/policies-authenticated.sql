-- Lock the database down to signed-in users.
--
-- Apply this ONLY after Supabase Auth is wired into the app. It replaces the
-- demo-open policies from schema.sql; until the app can sign a user in, running
-- this will make every query return empty.
--
-- Why it matters: the anon key is prefixed EXPO_PUBLIC_, so it ships inside the
-- client bundle. With the demo-open policies, that key is enough for anyone to
-- read and write the whole database. Requiring an authenticated role means a
-- leaked anon key alone is no longer sufficient.
--
-- This is still coarse: any signed-in user can see the whole group. Narrowing
-- it to "only groups you belong to" needs a membership table and a user id on
-- `friends`, which is a larger change.

-- ---------------------------------------------------------------
-- friends
-- ---------------------------------------------------------------
drop policy if exists "friends are viewable by everyone" on public.friends;
drop policy if exists "anyone can add a friend" on public.friends;

create policy "signed-in users can read friends"
  on public.friends for select to authenticated using (true);

create policy "signed-in users can add friends"
  on public.friends for insert to authenticated with check (true);

create policy "signed-in users can update friends"
  on public.friends for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------
-- books
-- ---------------------------------------------------------------
drop policy if exists "books are viewable by everyone" on public.books;
drop policy if exists "anyone can add a book" on public.books;
drop policy if exists "anyone can update a book" on public.books;

create policy "signed-in users can read books"
  on public.books for select to authenticated using (true);

create policy "signed-in users can add books"
  on public.books for insert to authenticated with check (true);

create policy "signed-in users can update books"
  on public.books for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------
-- reading_queue
-- ---------------------------------------------------------------
drop policy if exists "queue is viewable by everyone" on public.reading_queue;
drop policy if exists "anyone can add to the queue" on public.reading_queue;
drop policy if exists "anyone can update the queue" on public.reading_queue;

create policy "signed-in users can read the queue"
  on public.reading_queue for select to authenticated using (true);

create policy "signed-in users can add to the queue"
  on public.reading_queue for insert to authenticated with check (true);

create policy "signed-in users can update the queue"
  on public.reading_queue for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------
-- handoffs — still append-only: no update or delete policy is granted,
-- so travel history cannot be rewritten even by a signed-in user.
-- ---------------------------------------------------------------
drop policy if exists "handoffs are viewable by everyone" on public.handoffs;
drop policy if exists "anyone can record a handoff" on public.handoffs;

create policy "signed-in users can read handoffs"
  on public.handoffs for select to authenticated using (true);

create policy "signed-in users can record a handoff"
  on public.handoffs for insert to authenticated with check (true);

-- ---------------------------------------------------------------
-- Close the door as well as the lock.
--
-- The policies above already deny the anon role, since none of them apply to
-- it and RLS fails closed. Revoking its table privileges too means a policy
-- added carelessly later ("for select using (true)" with no role) cannot
-- accidentally re-expose the data to an unauthenticated caller.
-- ---------------------------------------------------------------
revoke all on public.friends from anon;
revoke all on public.books from anon;
revoke all on public.reading_queue from anon;
revoke all on public.handoffs from anon;
revoke all on public.book_current_location from anon;

-- The authenticated role keeps the grants from schema.sql. handoffs stays
-- select+insert only, so history remains append-only.
grant update on public.friends to authenticated;
