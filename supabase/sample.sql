-- The sample club: The Traveling Pants.
--
-- Carmen, Lena, Tibby and Bridget, in the places they spend the first book's
-- summer, passing five classics around. Every member of the app is in this
-- group (schema.sql adds them automatically), so a newcomer has a group with
-- some history to look around before their own gets going. It's read-only
-- for real people, and real members can't see each other through it.
--
-- Applied after schema.sql on every deploy, so it must stay safe to re-run:
-- everything is "on conflict do nothing", and the dates are set on the first
-- run and then age naturally.
--
-- `state` carries a region or country for international readers ('Greece',
-- 'Mexico'), which is why it's plain text rather than a two-letter code.

-- The group first, so the characters are added to it as they're inserted.
insert into public.groups (id, name, invite_code, is_sample) values
  ('group-pants', 'The Traveling Pants', 'sample-pants', true)
on conflict (id) do update set is_sample = true;

insert into public.friends (id, name, city, state, agreed_rules_at, is_character) values
  ('friend-lena',    'Lena Kaligaris',   'Santorini',       'Greece', now(), true),
  ('friend-tibby',   'Tibby Rollins',    'Bethesda',        'MD',     now(), true),
  ('friend-carmen',  'Carmen Lowell',    'Charleston',      'SC',     now(), true),
  ('friend-bridget', 'Bridget Vreeland', 'Baja California', 'Mexico', now(), true)
on conflict (id) do update set is_character = true;

insert into public.books (id, title, author, cover_color, gifted_by, group_id) values
  ('sample-pride',  'Pride and Prejudice',  'Jane Austen',       '#c89366', null,     'group-pants'),
  ('sample-room',   'A Room with a View',   'E. M. Forster',     '#c7a6b5', null,     'group-pants'),
  ('sample-little', 'Little Women',         'Louisa May Alcott', '#a8927d', 'Grandma', 'group-pants'),
  ('sample-anne',   'Anne of Green Gables', 'L. M. Montgomery',  '#8f9bb0', null,     'group-pants'),
  ('sample-eyre',   'Jane Eyre',            'Charlotte Brontë',  '#b4b8a9', null,     'group-pants')
on conflict (id) do nothing;

insert into public.reading_queue (book_id, friend_id, position, status) values
  -- Carmen's Pride and Prejudice: with Lena, Tibby and Bridget waiting.
  ('sample-pride',  'friend-carmen',  0, 'done'),
  ('sample-pride',  'friend-lena',    1, 'reading'),
  ('sample-pride',  'friend-tibby',   2, 'waiting'),
  ('sample-pride',  'friend-bridget', 3, 'waiting'),
  -- Lena's A Room with a View: in the post to Bridget right now.
  ('sample-room',   'friend-lena',    0, 'done'),
  ('sample-room',   'friend-bridget', 1, 'reading'),
  ('sample-room',   'friend-tibby',   2, 'waiting'),
  -- Tibby's Little Women (a gift from her grandmother): with Bridget.
  ('sample-little', 'friend-tibby',   0, 'done'),
  ('sample-little', 'friend-carmen',  1, 'done'),
  ('sample-little', 'friend-bridget', 2, 'reading'),
  -- Bridget's Anne of Green Gables: back home, and Tibby wants a reread.
  ('sample-anne',   'friend-bridget', 0, 'done'),
  ('sample-anne',   'friend-carmen',  2, 'done'),
  ('sample-anne',   'friend-tibby',   3, 'waiting'),
  -- Lena's Jane Eyre: all the way round the group and home again.
  ('sample-eyre',   'friend-lena',    0, 'done'),
  ('sample-eyre',   'friend-carmen',  1, 'done'),
  ('sample-eyre',   'friend-tibby',   2, 'done'),
  ('sample-eyre',   'friend-bridget', 3, 'done')
on conflict (book_id, friend_id) do nothing;

insert into public.handoffs
  (id, book_id, from_friend, to_friend, happened_at, received_at, place_city, place_region, rating, note)
values
  ('sample-pride-1',  'sample-pride',  null,             'friend-carmen',  now() - interval '41 days',  now() - interval '41 days',  'Charleston',      'SC',     null, null),
  ('sample-pride-2',  'sample-pride',  'friend-carmen',  'friend-lena',    now() - interval '12 days',  now() - interval '9 days',   'Santorini',       'Greece', 5, 'Read it somewhere sunny. You''ll work out which of us is which by chapter three.'),

  ('sample-room-1',   'sample-room',   null,             'friend-lena',    now() - interval '63 days',  now() - interval '63 days',  'Santorini',       'Greece', null, null),
  ('sample-room-2',   'sample-room',   'friend-lena',    'friend-bridget', now() - interval '5 hours',  null,                        'Baja California', 'Mexico', 3, 'Slow to start, then it''s all sunlight. Lucy is so frustrating and so right.'),

  ('sample-little-1', 'sample-little', null,             'friend-tibby',   now() - interval '94 days',  now() - interval '94 days',  'Bethesda',        'MD',     null, null),
  ('sample-little-2', 'sample-little', 'friend-tibby',   'friend-carmen',  now() - interval '38 days',  now() - interval '33 days',  'Charleston',      'SC',     4, 'Bring tissues. I mean it. Call me when you get to the end.'),
  ('sample-little-3', 'sample-little', 'friend-carmen',  'friend-bridget', now() - interval '7 days',   now() - interval '3 days',   'Baja California', 'Mexico', 5, 'I underlined way too much, sorry not sorry.'),

  ('sample-anne-1',   'sample-anne',   null,             'friend-bridget', now() - interval '121 days', now() - interval '121 days', 'Baja California', 'Mexico', null, null),
  ('sample-anne-2',   'sample-anne',   'friend-bridget', 'friend-tibby',   now() - interval '88 days',  now() - interval '84 days',  'Bethesda',        'MD',     4, 'Anne talks a lot for the first fifty pages. You''ll love her anyway.'),
  ('sample-anne-3',   'sample-anne',   'friend-tibby',   'friend-carmen',  now() - interval '59 days',  now() - interval '55 days',  'Charleston',      'SC',     5, 'Kindred spirits. That''s all I''ll say.'),
  ('sample-anne-4',   'sample-anne',   'friend-carmen',  'friend-bridget', now() - interval '20 days',  now() - interval '16 days',  'Baja California', 'Mexico', 4, 'Thank you for lending me your copy. It''s a little sandier now.'),

  ('sample-eyre-1',   'sample-eyre',   null,             'friend-lena',    now() - interval '200 days', now() - interval '200 days', 'Santorini',       'Greece', null, null),
  ('sample-eyre-2',   'sample-eyre',   'friend-lena',    'friend-carmen',  now() - interval '170 days', now() - interval '163 days', 'Charleston',      'SC',     5, 'Reader, I mailed it. Tell me when you meet Mr. Rochester.'),
  ('sample-eyre-3',   'sample-eyre',   'friend-carmen',  'friend-tibby',   now() - interval '140 days', now() - interval '136 days', 'Bethesda',        'MD',     4, 'Darker than I expected and better for it. Read the attic chapters at night.'),
  ('sample-eyre-4',   'sample-eyre',   'friend-tibby',   'friend-bridget', now() - interval '110 days', now() - interval '104 days', 'Baja California', 'Mexico', 5, 'Jane would have been great at soccer. Stubborn, fast, never quits.'),
  ('sample-eyre-5',   'sample-eyre',   'friend-bridget', 'friend-lena',    now() - interval '75 days',  now() - interval '68 days',  'Santorini',       'Greece', 5, 'Home it goes, with sand in the spine. Thank you for starting this one.')
on conflict (id) do nothing;

-- Everyone already in the app is in the sample group too (new people are
-- added as they join, by the trigger in schema.sql).
insert into public.group_members (group_id, person_id)
select 'group-pants', id from public.friends
on conflict do nothing;
