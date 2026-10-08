-- Example seed — fictional group, safe to commit.
--
-- The four girls from The Sisterhood of the Traveling Pants, in the places they
-- spend the first book's summer: Lena with her grandparents on Santorini,
-- Bridget at soccer camp in Baja, Carmen visiting her dad in Charleston, and
-- Tibby holding down the summer at home in Bethesda.
--
-- This exists so the repo has runnable demo data without putting anyone's real
-- name in a public repository. For your own group, copy this file to
-- supabase/seed.local.sql (gitignored) and edit it there.
--
-- Run supabase/schema.sql first. Safe to re-run.
--
-- Note: `state` carries a region or country for international readers
-- ('Greece', 'Mexico'), which is why it is plain text rather than a
-- two-letter code.

insert into public.friends (id, name, city, state, email) values
  ('friend-lena',    'Lena Kaligaris',   'Santorini',       'Greece', 'lena@example.com'),
  ('friend-tibby',   'Tibby Rollins',    'Bethesda',        'MD',     'tibby@example.com'),
  ('friend-carmen',  'Carmen Lowell',    'Charleston',      'SC',     'carmen@example.com'),
  ('friend-bridget', 'Bridget Vreeland', 'Baja California', 'Mexico', 'bridget@example.com')
on conflict (id) do nothing;

insert into public.books (id, title, author, cover_color, status) values
  ('book-1', 'The Secret Life of Bees', 'Sue Monk Kidd', '#d9a77d', 'reading'),
  ('book-2', 'Circe', 'Madeline Miller', '#b4b8a9', 'in-transit'),
  ('book-3', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', '#c7a6b5', 'annotated'),
  ('book-4', 'Piranesi', 'Susanna Clarke', '#93a7a5', 'returned')
on conflict (id) do nothing;

insert into public.reading_queue (book_id, friend_id, position, status) values
  ('book-1', 'friend-carmen',  0, 'done'),
  ('book-1', 'friend-lena',    1, 'reading'),
  ('book-1', 'friend-tibby',   2, 'waiting'),
  ('book-1', 'friend-bridget', 3, 'waiting'),
  ('book-2', 'friend-lena',    0, 'done'),
  ('book-2', 'friend-bridget', 1, 'waiting'),
  ('book-2', 'friend-tibby',   2, 'waiting'),
  ('book-3', 'friend-tibby',   0, 'done'),
  ('book-3', 'friend-carmen',  1, 'done'),
  ('book-3', 'friend-bridget', 2, 'reading'),
  ('book-4', 'friend-bridget', 0, 'done'),
  ('book-4', 'friend-tibby',   1, 'done'),
  ('book-4', 'friend-carmen',  2, 'done')
on conflict (book_id, friend_id) do nothing;

insert into public.handoffs (id, book_id, from_friend, to_friend, happened_at) values
  ('handoff-1a', 'book-1', null,              'friend-carmen',  now() - interval '41 days'),
  ('handoff-1b', 'book-1', 'friend-carmen',   'friend-lena',    now() - interval '12 days'),
  ('handoff-2a', 'book-2', null,              'friend-lena',    now() - interval '63 days'),
  ('handoff-2b', 'book-2', 'friend-lena',     'friend-bridget', now() - interval '5 hours'),
  ('handoff-3a', 'book-3', null,              'friend-tibby',   now() - interval '94 days'),
  ('handoff-3b', 'book-3', 'friend-tibby',    'friend-carmen',  now() - interval '38 days'),
  ('handoff-3c', 'book-3', 'friend-carmen',   'friend-bridget', now() - interval '7 days'),
  ('handoff-4a', 'book-4', null,              'friend-bridget', now() - interval '121 days'),
  ('handoff-4b', 'book-4', 'friend-bridget',  'friend-tibby',   now() - interval '88 days'),
  ('handoff-4c', 'book-4', 'friend-tibby',    'friend-carmen',  now() - interval '59 days')
on conflict (id) do nothing;
