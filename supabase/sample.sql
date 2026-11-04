-- The sample clubs:
-- 1. The Traveling Pants (Carmen, Lena, Tibby, Bridget)
-- 2. The One with the Book Club (Rachel, Joey, Monica, Chandler, Ross, Phoebe)
--
-- Every member of the app is in these groups (schema.sql adds them automatically),
-- so a newcomer has sample clubs with rich history to explore before their own
-- gets going. Read-only for real people, and real members cannot see each other through it.
--
-- Applied after schema.sql on every deploy, so it must stay safe to re-run:
-- everything is "on conflict do nothing".

insert into public.groups (id, name, invite_code, is_sample) values
  ('group-pants',   'The Traveling Pants',        'sample-pants',   true),
  ('group-friends', 'The One with the Book Club', 'sample-friends', true)
on conflict (id) do update set is_sample = true;

insert into public.friends (id, name, city, state, agreed_rules_at, is_character) values
  -- The Traveling Pants
  ('friend-lena',     'Lena Kaligaris',   'Santorini',        'Greece', now(), true),
  ('friend-tibby',    'Tibby Rollins',    'Bethesda',         'MD',     now(), true),
  ('friend-carmen',   'Carmen Lowell',    'Charleston',       'SC',     now(), true),
  ('friend-bridget',  'Bridget Vreeland', 'Baja California',  'Mexico', now(), true),
  -- The One with the Book Club
  ('friend-rachel',   'Rachel Green',     'Greenwich Village', 'NY',    now(), true),
  ('friend-joey',     'Joey Tribbiani',   'Greenwich Village', 'NY',    now(), true),
  ('friend-monica',   'Monica Geller',    'Greenwich Village', 'NY',    now(), true),
  ('friend-chandler', 'Chandler Bing',    'Greenwich Village', 'NY',    now(), true),
  ('friend-ross',     'Ross Geller',      'East Village',      'NY',    now(), true),
  ('friend-phoebe',   'Phoebe Buffay',    'Greenwich Village', 'NY',    now(), true)
on conflict (id) do update set is_character = true;

insert into public.books (id, title, author, cover_color, gifted_by, group_id, archived_at) values
  -- The Traveling Pants
  ('sample-pride',    'Pride and Prejudice',              'Jane Austen',        '#c89366', null,          'group-pants',   null),
  ('sample-room',     'A Room with a View',               'E. M. Forster',      '#c7a6b5', null,          'group-pants',   null),
  ('sample-catcher',  'The Catcher in the Rye',           'J. D. Salinger',     '#c5533e', 'Bailey',       'group-pants',   null),
  ('sample-anne',     'Anne of Green Gables',             'L. M. Montgomery',   '#8f9bb0', null,          'group-pants',   null),
  ('sample-eyre',     'Jane Eyre',                        'Charlotte Brontë',   '#b4b8a9', null,          'group-pants',   null),
  ('sample-outsiders','The Outsiders',                    'S. E. Hinton',       '#b8966c', null,          'group-pants',   now() - interval '15 days'),
  -- The One with the Book Club
  ('sample-little',   'Little Women',                     'Louisa May Alcott',  '#a8927d', 'Mrs. Green',  'group-friends', null),
  ('sample-shining',  'The Shining',                      'Stephen King',       '#8c3a38', null,          'group-friends', null),
  ('sample-french',   'Mastering the Art of French Cooking', 'Julia Child',     '#3d5a80', null,          'group-friends', null),
  ('sample-jurassic', 'Jurassic Park',                    'Michael Crichton',   '#4a5320', null,          'group-friends', null),
  ('sample-seagull',  'Jonathan Livingston Seagull',      'Richard Bach',       '#7ea8be', 'Grandma Lily', 'group-friends', null),
  ('sample-mesozoic', 'Paleontology and the Mesozoic Era','Dr. Ross Geller',    '#6b705c', null,          'group-friends', now() - interval '12 days')
on conflict (id) do nothing;

insert into public.reading_queue (book_id, friend_id, position, status) values
  -- The Traveling Pants
  ('sample-pride',     'friend-carmen',   0, 'done'),
  ('sample-pride',     'friend-lena',     1, 'reading'),
  ('sample-pride',     'friend-tibby',    2, 'waiting'),
  ('sample-pride',     'friend-bridget',  3, 'waiting'),

  ('sample-room',      'friend-lena',     0, 'done'),
  ('sample-room',      'friend-bridget',  1, 'reading'),
  ('sample-room',      'friend-tibby',    2, 'waiting'),

  ('sample-catcher',   'friend-tibby',    0, 'done'),
  ('sample-catcher',   'friend-carmen',   1, 'done'),
  ('sample-catcher',   'friend-bridget',  2, 'reading'),
  ('sample-catcher',   'friend-lena',     3, 'waiting'),

  ('sample-anne',      'friend-bridget',  0, 'done'),
  ('sample-anne',      'friend-carmen',   2, 'done'),
  ('sample-anne',      'friend-tibby',    3, 'waiting'),

  ('sample-eyre',      'friend-lena',     0, 'done'),
  ('sample-eyre',      'friend-carmen',   1, 'done'),
  ('sample-eyre',      'friend-tibby',    2, 'done'),
  ('sample-eyre',      'friend-bridget',  3, 'done'),

  ('sample-outsiders', 'friend-carmen',   0, 'done'),
  ('sample-outsiders', 'friend-lena',     1, 'done'),
  ('sample-outsiders', 'friend-bridget',  2, 'done'),

  -- The One with the Book Club
  ('sample-little',    'friend-rachel',   0, 'done'),
  ('sample-little',    'friend-joey',     1, 'reading'),
  ('sample-little',    'friend-monica',   2, 'waiting'),
  ('sample-little',    'friend-phoebe',   3, 'waiting'),

  ('sample-shining',   'friend-joey',     0, 'done'),
  ('sample-shining',   'friend-rachel',   1, 'reading'),
  ('sample-shining',   'friend-chandler', 2, 'waiting'),

  ('sample-french',    'friend-monica',   0, 'done'),
  ('sample-french',    'friend-chandler', 1, 'done'),
  ('sample-french',    'friend-rachel',   2, 'done'),
  ('sample-french',    'friend-monica',   3, 'reading'),

  ('sample-jurassic',  'friend-ross',     0, 'done'),
  ('sample-jurassic',  'friend-chandler', 1, 'done'),
  ('sample-jurassic',  'friend-joey',     2, 'waiting'),

  ('sample-seagull',   'friend-phoebe',   0, 'done'),
  ('sample-seagull',   'friend-joey',     1, 'done'),
  ('sample-seagull',   'friend-monica',   2, 'waiting'),

  ('sample-mesozoic',  'friend-ross',     0, 'done')
on conflict (book_id, friend_id) do nothing;

insert into public.handoffs
  (id, book_id, from_friend, to_friend, happened_at, received_at, place_city, place_region, rating, note)
values
  -- The Traveling Pants
  ('sample-pride-1',     'sample-pride',     null,             'friend-carmen',  now() - interval '41 days',  now() - interval '41 days',  'Charleston',      'SC',     null, null),
  ('sample-pride-2',     'sample-pride',     'friend-carmen',  'friend-lena',    now() - interval '12 days',  now() - interval '9 days',   'Santorini',       'Greece', 5, 'Read it somewhere sunny. You''ll work out which of us is which by chapter three.'),

  ('sample-room-1',      'sample-room',      null,             'friend-lena',    now() - interval '63 days',  now() - interval '63 days',  'Santorini',       'Greece', null, null),
  ('sample-room-2',      'sample-room',      'friend-lena',    'friend-bridget', now() - interval '5 hours',  null,                        'Baja California', 'Mexico', 3, 'Slow to start, then it''s all sunlight. Lucy is so frustrating and so right.'),

  ('sample-catcher-1',   'sample-catcher',   null,             'friend-tibby',   now() - interval '94 days',  now() - interval '94 days',  'Bethesda',        'MD',     null, null),
  ('sample-catcher-2',   'sample-catcher',   'friend-tibby',   'friend-carmen',  now() - interval '38 days',  now() - interval '33 days',  'Charleston',      'SC',     5, 'Holden would hate Wallmans as much as I do. Bailey picked this out. You''ll love chapter 16.'),
  ('sample-catcher-3',   'sample-catcher',   'friend-carmen',  'friend-bridget', now() - interval '7 days',   now() - interval '3 days',   'Baja California', 'Mexico', 5, 'Cried at the carousel scene. Keep the red hunting hat in mind when you run.'),

  ('sample-anne-1',      'sample-anne',      null,             'friend-bridget', now() - interval '121 days', now() - interval '121 days', 'Baja California', 'Mexico', null, null),
  ('sample-anne-2',      'sample-anne',      'friend-bridget', 'friend-tibby',   now() - interval '88 days',  now() - interval '84 days',  'Bethesda',        'MD',     4, 'Anne talks a lot for the first fifty pages. You''ll love her anyway.'),
  ('sample-anne-3',      'sample-anne',      'friend-tibby',   'friend-carmen',  now() - interval '59 days',  now() - interval '55 days',  'Charleston',      'SC',     5, 'Kindred spirits. That''s all I''ll say.'),
  ('sample-anne-4',      'sample-anne',      'friend-carmen',  'friend-bridget', now() - interval '20 days',  now() - interval '16 days',  'Baja California', 'Mexico', 4, 'Thank you for lending me your copy. It''s a little sandier now.'),

  ('sample-eyre-1',      'sample-eyre',      null,             'friend-lena',    now() - interval '200 days', now() - interval '200 days', 'Santorini',       'Greece', null, null),
  ('sample-eyre-2',      'sample-eyre',      'friend-lena',    'friend-carmen',  now() - interval '170 days', now() - interval '163 days', 'Charleston',      'SC',     5, 'Reader, I mailed it. Tell me when you meet Mr. Rochester.'),
  ('sample-eyre-3',      'sample-eyre',      'friend-carmen',  'friend-tibby',   now() - interval '140 days', now() - interval '136 days', 'Bethesda',        'MD',     4, 'Darker than I expected and better for it. Read the attic chapters at night.'),
  ('sample-eyre-4',      'sample-eyre',      'friend-tibby',   'friend-bridget', now() - interval '110 days', now() - interval '104 days', 'Baja California', 'Mexico', 5, 'Jane would have been great at soccer. Stubborn, fast, never quits.'),
  ('sample-eyre-5',      'sample-eyre',      'friend-bridget', 'friend-lena',    now() - interval '75 days',  now() - interval '68 days',  'Santorini',       'Greece', 5, 'Home it goes, with sand in the spine. Thank you for starting this one.'),

  ('sample-outsiders-1', 'sample-outsiders', null,             'friend-carmen',  now() - interval '180 days', now() - interval '180 days', 'Charleston',      'SC',     null, null),
  ('sample-outsiders-2', 'sample-outsiders', 'friend-carmen',  'friend-lena',    now() - interval '130 days', now() - interval '124 days', 'Santorini',       'Greece', 5, 'Stay gold, Ponyboy. Pass it to Bee next.'),
  ('sample-outsiders-3', 'sample-outsiders', 'friend-lena',    'friend-bridget', now() - interval '80 days',  now() - interval '74 days',  'Baja California', 'Mexico', 5, 'Read the poem in chapter 5 out loud. It feels like our summer.'),
  ('sample-outsiders-4', 'sample-outsiders', 'friend-bridget', 'friend-carmen',  now() - interval '30 days',  now() - interval '26 days',  'Charleston',      'SC',     5, 'Resting safely on the home shelf now. Stay gold, sisterhood.'),

  -- The One with the Book Club
  ('sample-little-1',    'sample-little',    null,             'friend-rachel',  now() - interval '28 days',  now() - interval '28 days',  'Greenwich Village', 'NY',    null, null),
  ('sample-little-2',    'sample-little',    'friend-rachel',  'friend-joey',    now() - interval '5 days',   now() - interval '5 days',   'Greenwich Village', 'NY',    5, 'Read it and you''ll understand Jo March. If Beth gets sick and you get scared, remember: you can always put it in the freezer.'),

  ('sample-shining-1',   'sample-shining',   null,             'friend-joey',    now() - interval '35 days',  now() - interval '35 days',  'Greenwich Village', 'NY',    null, null),
  ('sample-shining-2',   'sample-shining',   'friend-joey',    'friend-rachel',  now() - interval '2 hours',  null,                        'Greenwich Village', 'NY',    5, 'Do NOT read chapter 22 alone after midnight. When you hear weird noises from the radiator, put the book in the freezer right next to the pizza.'),

  ('sample-french-1',    'sample-french',    null,             'friend-monica',  now() - interval '110 days', now() - interval '110 days', 'Greenwich Village', 'NY',    null, null),
  ('sample-french-2',    'sample-french',    'friend-monica',  'friend-chandler',now() - interval '75 days',  now() - interval '72 days',  'Greenwich Village', 'NY',    5, 'Rule 1: Always use a coaster. Rule 2: Clean hands only. Rule 3: Absolutely NO marinara near page 142.'),
  ('sample-french-3',    'sample-french',    'friend-chandler','friend-rachel',  now() - interval '42 days',  now() - interval '40 days',  'Greenwich Village', 'NY',    4, 'Could this book BE any heavier? I dropped it once and heard Monica yelling through the floorboards.'),
  ('sample-french-4',    'sample-french',    'friend-rachel',  'friend-monica',  now() - interval '10 days',  now() - interval '8 days',   'Greenwich Village', 'NY',    5, 'Made the beef bourguignon and the trifle. One page smells faintly of custard, but the book survived!'),

  ('sample-jurassic-1',  'sample-jurassic',  null,             'friend-ross',    now() - interval '150 days', now() - interval '150 days', 'East Village',      'NY',    null, null),
  ('sample-jurassic-2',  'sample-jurassic',  'friend-ross',    'friend-chandler',now() - interval '95 days',  now() - interval '90 days',  'London',            'UK',    4, 'Scientifically inaccurate regarding amber DNA preservation, but thrilling. I have penned explanatory notes in the margins.'),
  ('sample-jurassic-3',  'sample-jurassic',  'friend-chandler','friend-ross',    now() - interval '35 days',  now() - interval '30 days',  'Tulsa',             'OK',    4, 'Thanks for the bedtime reading, Ross. I spent three nights convinced a velociraptor was working the Tulsa office copy machine.'),

  ('sample-seagull-1',   'sample-seagull',   null,             'friend-phoebe',  now() - interval '80 days',  now() - interval '80 days',  'Greenwich Village', 'NY',    null, null),
  ('sample-seagull-2',   'sample-seagull',   'friend-phoebe',  'friend-joey',    now() - interval '48 days',  now() - interval '45 days',  'Greenwich Village', 'NY',    5, 'This seagull broke free from earthly limitations and found pure enlightenment. I played Smelly Cat while reading chapter 3.'),
  ('sample-seagull-3',   'sample-seagull',   'friend-joey',    'friend-phoebe',  now() - interval '16 days',  now() - interval '14 days',  'Greenwich Village', 'NY',    5, 'A bird doing supersonic loops! Way easier to read than Ross''s dinosaur book. Five stars!'),

  ('sample-mesozoic-1',  'sample-mesozoic',  null,             'friend-ross',    now() - interval '210 days', now() - interval '210 days', 'East Village',      'NY',    null, null)
on conflict (id) do nothing;

-- Add all users into both sample groups.
insert into public.group_members (group_id, person_id)
select g.id, f.id from public.groups g cross join public.friends f
where g.is_sample
on conflict do nothing;

-- Covers from Open Library.
update public.books b set cover_url = 'https://covers.openlibrary.org/b/id/' || c.cover_id || '-M.jpg'
from (values
  ('sample-pride',     '14348537'),
  ('sample-room',      '1748132'),
  ('sample-catcher',   '8225261'),
  ('sample-anne',      '14641084'),
  ('sample-eyre',      '8235363'),
  ('sample-outsiders', '8235109'),
  ('sample-little',    '8775559'),
  ('sample-shining',   '8231990'),
  ('sample-french',    '8739161'),
  ('sample-jurassic',  '9255566'),
  ('sample-seagull',   '8589600')
) as c(book_id, cover_id)
where b.id = c.book_id;
