-- Groups, the sample club and friend requests: nothing leaks between groups,
-- the sample club is look-don't-touch, and nobody acts as someone else.
\set ON_ERROR_STOP on
\set QUIET on

create schema if not exists test;
create or replace function test.as_user(uid text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false); end $$;
create or replace function test.expect(label text, actual bigint, expected bigint) returns text
language plpgsql as $$
begin
  if actual <> expected then raise exception 'FAIL %: got %, expected %', label, actual, expected; end if;
  return 'ok  ' || label;
end $$;
-- Run a statement that must be refused.
create or replace function test.refused(label text, statement text) returns text
language plpgsql as $$
begin
  execute statement;
  raise exception 'FAIL %: it was allowed', label;
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  return 'ok  ' || label;
end $$;
grant usage on schema test to authenticated, anon;
grant execute on all functions in schema test to authenticated, anon;

-- Accounts. Ada runs two real groups: "Real club" with Bea, and
-- "Living room" with Cal. Dot has only just signed up.
insert into auth.users values
  ('00000000-0000-0000-0000-0000000000a2', 'ada@x'),
  ('00000000-0000-0000-0000-0000000000a3', 'bea@x'),
  ('00000000-0000-0000-0000-0000000000a4', 'cal@x'),
  ('00000000-0000-0000-0000-0000000000a5', 'dot@x'),
  ('00000000-0000-0000-0000-0000000000a6', 'eli@x'),
  ('00000000-0000-0000-0000-0000000000a7', 'newcomer@x');

-- How big the sample groups are (sample.sql), so the counts below don't go stale.
select count(*) as n_sample from books b join groups g on g.id = b.group_id where g.is_sample \gset
select count(*) as n_characters from friends where is_character \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000a2');
insert into friends (id, name, city, state, user_id) values ('p-ada', 'Ada', 'Los Angeles', 'CA', '00000000-0000-0000-0000-0000000000a2');
select create_group('g-real', 'Real club');
select create_group('g-room', 'Living room');
select test.as_user('00000000-0000-0000-0000-0000000000a3');
insert into friends (id, name, city, state, user_id) values ('p-bea', 'Bea', 'St. Louis', 'MO', '00000000-0000-0000-0000-0000000000a3');
select test.as_user('00000000-0000-0000-0000-0000000000a4');
insert into friends (id, name, city, state, user_id) values ('p-cal', 'Cal', 'Seattle', 'WA', '00000000-0000-0000-0000-0000000000a4');
select test.as_user('00000000-0000-0000-0000-0000000000a5');
insert into friends (id, name, city, state, user_id) values ('p-dot', 'Dot', 'Austin', 'TX', '00000000-0000-0000-0000-0000000000a5');
reset role;
select invite_code as real_code from groups where id = 'g-real' \gset
select invite_code as room_code from groups where id = 'g-room' \gset
-- Eli was added before he had an account.
insert into friends (id, name, city, state) values ('p-eli', 'Eli', 'Los Angeles', 'CA');
insert into group_members values ('g-room', 'p-eli');

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select join_group(:'real_code');
select test.as_user('00000000-0000-0000-0000-0000000000a4');
select join_group(:'room_code');
select test.as_user('00000000-0000-0000-0000-0000000000a2');
select lend_book('b-real', 'Discerning the Voice of God', 'Priscilla Shirer', '#000', 'h-real', 'Claire', 'g-real');
select lend_book('b-room', 'The Art of Asking Better Questions', 'J. R. Briggs', '#000', 'h-room', null, 'g-room');

-- The sample club: everyone's in it, and can look.
select test.as_user('00000000-0000-0000-0000-0000000000a5');   -- Dot, brand new
select test.expect('Dot was added to all four sample groups when she joined', (select count(*) from group_members m join groups g on g.id = m.group_id where g.is_sample and m.person_id = 'p-dot'), 4);
select test.expect('Dot was added to the sample club when she joined', (select count(*) from group_members where group_id = 'group-pants' and person_id = 'p-dot'), 1);
select test.expect('Dot sees the sample books and nothing else', (select count(*) from books), :n_sample);
select test.expect('Dot sees the sample characters and herself', (select count(*) from friends), :n_characters + 1);
select test.expect('Dot sees no other real member of the sample club', (select count(*) from group_members where group_id = 'group-pants' and person_id like 'p-%' and person_id <> 'p-dot'), 0);
select test.refused('Dot cannot join a sample line', $$insert into reading_queue (book_id, friend_id, position, status) values ('sample-pride', 'p-dot', 9, 'waiting')$$);
select test.refused('Dot cannot lend into the sample club', $$select lend_book('b-x', 'X', 'Y', '#000', 'h-x', null, 'group-pants')$$);
select test.refused('Dot cannot friend-request a character', $$insert into friendships (friend_a, friend_b, requested_by, status) values ('friend-lena', 'p-dot', 'p-dot', 'pending')$$);
select test.expect('The sample code lists nobody to claim', (select count(*) from unclaimed_in_group('sample-pants')), 0);
-- A brand-new account (no profile yet) can't take a character either.
select test.as_user('00000000-0000-0000-0000-0000000000a7');
select test.refused('A new account cannot claim Lena', $$select claim_profile('friend-lena', 'sample-pants')$$);

-- Real groups: walls between them.
select test.as_user('00000000-0000-0000-0000-0000000000a3');   -- Bea (Real club)
select test.expect('Bea sees the sample books and the Real club book', (select count(*) from books), :n_sample + 1);
select test.expect('Bea cannot see the Living room book', (select count(*) from books where id = 'b-room'), 0);
select test.expect('Bea cannot see Cal', (select count(*) from friends where id = 'p-cal'), 0);
select test.expect('Bea cannot see Dot through the sample club', (select count(*) from friends where id = 'p-dot'), 0);
select test.expect('Bea sees Ada (Real club)', (select count(*) from friends where id = 'p-ada'), 1);
select test.expect('Bea cannot see the Living room group', (select count(*) from groups where id = 'g-room'), 0);
select test.refused('Bea cannot join the Living room line', $$insert into reading_queue (book_id, friend_id, position, status) values ('b-room', 'p-bea', 9, 'waiting')$$);
select test.refused('Bea cannot friend-request Cal', $$insert into friendships (friend_a, friend_b, requested_by, status) values ('p-cal', 'p-bea', 'p-bea', 'pending')$$);
select test.expect('Bea sees Claire''s gift', (select count(*) from books where gifted_by = 'Claire'), 1);

select test.as_user('00000000-0000-0000-0000-0000000000a4');   -- Cal (Living room)
select test.expect('Cal sees the sample books and the Living room book', (select count(*) from books), :n_sample + 1);
select test.expect('Cal cannot see Bea', (select count(*) from friends where id = 'p-bea'), 0);

select test.as_user('00000000-0000-0000-0000-0000000000a2');   -- Ada (both)
select test.expect('Ada sees the sample books and both her groups books', (select count(*) from books), :n_sample + 2);

-- Friend requests: ask, can't accept your own, accept, unfriend.
select test.as_user('00000000-0000-0000-0000-0000000000a3');
insert into friendships (friend_a, friend_b, requested_by, status) values ('p-ada', 'p-bea', 'p-bea', 'pending');
update friendships set status = 'accepted' where friend_a = 'p-ada' and friend_b = 'p-bea';
select test.expect('Bea cannot accept her own request', (select count(*) from friendships where status = 'accepted'), 0);
select test.as_user('00000000-0000-0000-0000-0000000000a2');
update friendships set status = 'accepted' where friend_a = 'p-ada' and friend_b = 'p-bea';
select test.expect('Ada accepted Bea', (select count(*) from friendships where status = 'accepted'), 1);
select test.as_user('00000000-0000-0000-0000-0000000000a4');
select test.expect('Cal cannot see the Ada–Bea friendship', (select count(*) from friendships), 0);
select test.as_user('00000000-0000-0000-0000-0000000000a3');
delete from friendships where friend_a = 'p-ada' and friend_b = 'p-bea';
select test.expect('Bea unfriended Ada', (select count(*) from friendships), 0);

-- Covers: only the owner, and only Open Library images.
select test.as_user('00000000-0000-0000-0000-0000000000a2');
select set_cover('b-real', 'https://covers.openlibrary.org/b/id/1511890-M.jpg');
select test.refused('Covers must come from Open Library', $$select set_cover('b-real', 'https://evil.example/x.jpg')$$);
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select test.refused('Bea cannot change Ada''s cover', $$select set_cover('b-real', null)$$);

-- "Nobody" means nobody: Ada turns friend requests off, and Bea (a
-- groupmate) can no longer ask.
select test.as_user('00000000-0000-0000-0000-0000000000a2');
update friends set friend_requests_from = 'nobody' where id = 'p-ada';
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select test.refused('Bea cannot ask Ada once Ada takes no requests', $$insert into friendships (friend_a, friend_b, requested_by, status) values ('p-ada', 'p-bea', 'p-bea', 'pending')$$);
select test.as_user('00000000-0000-0000-0000-0000000000a2');
update friends set friend_requests_from = 'groups' where id = 'p-ada';

-- Claiming: only with the right invite code.
select test.as_user('00000000-0000-0000-0000-0000000000a6');   -- Eli, from Ada's link
select test.expect('An account with no profile yet sees nothing', (select count(*) from books), 0);
select test.expect('Unclaimed list needs the right code', (select count(*) from unclaimed_in_group('wrong')), 0);
select test.refused('Wrong code cannot claim Eli', $$select claim_profile('p-eli', 'wrong')$$);
select test.expect('Eli sees himself in the Living room list', (select count(*) from unclaimed_in_group(:'room_code') where id = 'p-eli'), 1);
select test.expect('Eli claims his profile', (select count(*) from (select claim_profile('p-eli', :'room_code')) c), 1);
select test.expect('Eli now sees the Living room book', (select count(*) from books where id = 'b-room'), 1);

-- Signed out: an invite code shows its group's name, and nothing else is open.
set role anon;
select test.expect('Signed out, an invite code names its group', (select count(*) from group_preview(:'room_code')), 1);
select test.expect('Signed out, a wrong code names nothing', (select count(*) from group_preview('wrong')), 0);
do $$ begin
  perform 1 from groups;
  raise exception 'FAIL: anonymous visitors can list groups';
exception when insufficient_privilege then raise notice 'ok  Signed out, groups stay closed';
end $$;
set role authenticated;

-- Leaving.
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select leave_group('g-real');
select test.expect('Bea sees only the sample clubs after leaving', (select count(*) from books), :n_sample);

reset role;
select 'ALL GROUP TESTS PASSED';
