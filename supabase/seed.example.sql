-- Example seed — fictional circle, safe to commit.
--
-- This exists so the repo has runnable demo data without putting anyone's
-- real name in a public repository. For your own circle, copy this file to
-- supabase/seed.local.sql (gitignored) and edit it there.
--
-- Run supabase/schema.sql first. Safe to re-run.

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
