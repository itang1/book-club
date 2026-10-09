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
grant usage on schema test to authenticated;
grant execute on all functions in schema test to authenticated;

-- Accounts. Irene runs two real groups: "Real club" with Juhyae, and
-- "Living room" with Becky. Eve has only just signed up.
insert into auth.users values
  ('00000000-0000-0000-0000-0000000000a2', 'irene@x'),
  ('00000000-0000-0000-0000-0000000000a3', 'juhyae@x'),
  ('00000000-0000-0000-0000-0000000000a4', 'becky@x'),
  ('00000000-0000-0000-0000-0000000000a5', 'eve@x'),
  ('00000000-0000-0000-0000-0000000000a6', 'albert@x'),
  ('00000000-0000-0000-0000-0000000000a7', 'newcomer@x');

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000a2');
insert into friends (id, name, city, state, user_id) values ('p-irene', 'Irene', 'Los Angeles', 'CA', '00000000-0000-0000-0000-0000000000a2');
select create_group('g-real', 'Real club');
select create_group('g-room', 'Living room');
select test.as_user('00000000-0000-0000-0000-0000000000a3');
insert into friends (id, name, city, state, user_id) values ('p-juhyae', 'Juhyae', 'St. Louis', 'MO', '00000000-0000-0000-0000-0000000000a3');
select test.as_user('00000000-0000-0000-0000-0000000000a4');
insert into friends (id, name, city, state, user_id) values ('p-becky', 'Becky', 'Seattle', 'WA', '00000000-0000-0000-0000-0000000000a4');
select test.as_user('00000000-0000-0000-0000-0000000000a5');
insert into friends (id, name, city, state, user_id) values ('p-eve', 'Eve', 'Austin', 'TX', '00000000-0000-0000-0000-0000000000a5');
reset role;
select invite_code as real_code from groups where id = 'g-real' \gset
select invite_code as room_code from groups where id = 'g-room' \gset
-- Albert was added before he had an account.
insert into friends (id, name, city, state) values ('p-albert', 'Albert', 'Los Angeles', 'CA');
insert into group_members values ('g-room', 'p-albert');

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select join_group(:'real_code');
select test.as_user('00000000-0000-0000-0000-0000000000a4');
select join_group(:'room_code');
select test.as_user('00000000-0000-0000-0000-0000000000a2');
select lend_book('b-real', 'Discerning the Voice of God', 'Priscilla Shirer', '#000', 'h-real', 'Claire', 'g-real');
select lend_book('b-room', 'The Art of Asking Better Questions', 'J. R. Briggs', '#000', 'h-room', null, 'g-room');

-- The sample club: everyone's in it, and can look.
select test.as_user('00000000-0000-0000-0000-0000000000a5');   -- Eve, brand new
select test.expect('Eve was added to the sample club when she joined', (select count(*) from group_members where group_id = 'group-pants' and person_id = 'p-eve'), 1);
select test.expect('Eve sees the 5 sample books and nothing else', (select count(*) from books), 5);
select test.expect('Eve sees the four characters and herself', (select count(*) from friends), 5);
select test.expect('Eve sees no other real member of the sample club', (select count(*) from group_members where group_id = 'group-pants' and person_id like 'p-%' and person_id <> 'p-eve'), 0);
select test.refused('Eve cannot join a sample line', $$insert into reading_queue (book_id, friend_id, position, status) values ('sample-pride', 'p-eve', 9, 'waiting')$$);
select test.refused('Eve cannot lend into the sample club', $$select lend_book('b-x', 'X', 'Y', '#000', 'h-x', null, 'group-pants')$$);
select test.refused('Eve cannot friend-request a character', $$insert into friendships (friend_a, friend_b, requested_by, status) values ('friend-lena', 'p-eve', 'p-eve', 'pending')$$);
select test.expect('The sample code lists nobody to claim', (select count(*) from unclaimed_in_group('sample-pants')), 0);
-- A brand-new account (no profile yet) can't take a character either.
select test.as_user('00000000-0000-0000-0000-0000000000a7');
select test.refused('A new account cannot claim Lena', $$select claim_profile('friend-lena', 'sample-pants')$$);

-- Real groups: walls between them.
select test.as_user('00000000-0000-0000-0000-0000000000a3');   -- Juhyae (Real club)
select test.expect('Juhyae sees the sample books and the Real club book', (select count(*) from books), 6);
select test.expect('Juhyae cannot see the Living room book', (select count(*) from books where id = 'b-room'), 0);
select test.expect('Juhyae cannot see Becky', (select count(*) from friends where id = 'p-becky'), 0);
select test.expect('Juhyae cannot see Eve through the sample club', (select count(*) from friends where id = 'p-eve'), 0);
select test.expect('Juhyae sees Irene (Real club)', (select count(*) from friends where id = 'p-irene'), 1);
select test.expect('Juhyae cannot see the Living room group', (select count(*) from groups where id = 'g-room'), 0);
select test.refused('Juhyae cannot join the Living room line', $$insert into reading_queue (book_id, friend_id, position, status) values ('b-room', 'p-juhyae', 9, 'waiting')$$);
select test.refused('Juhyae cannot friend-request Becky', $$insert into friendships (friend_a, friend_b, requested_by, status) values ('p-becky', 'p-juhyae', 'p-juhyae', 'pending')$$);
select test.expect('Juhyae sees Claire''s gift', (select count(*) from books where gifted_by = 'Claire'), 1);

select test.as_user('00000000-0000-0000-0000-0000000000a4');   -- Becky (Living room)
select test.expect('Becky sees the sample books and the Living room book', (select count(*) from books), 6);
select test.expect('Becky cannot see Juhyae', (select count(*) from friends where id = 'p-juhyae'), 0);

select test.as_user('00000000-0000-0000-0000-0000000000a2');   -- Irene (both)
select test.expect('Irene sees the sample books and both her groups books', (select count(*) from books), 7);

-- Friend requests: ask, can't accept your own, accept, unfriend.
select test.as_user('00000000-0000-0000-0000-0000000000a3');
insert into friendships (friend_a, friend_b, requested_by, status) values ('p-irene', 'p-juhyae', 'p-juhyae', 'pending');
update friendships set status = 'accepted' where friend_a = 'p-irene' and friend_b = 'p-juhyae';
select test.expect('Juhyae cannot accept her own request', (select count(*) from friendships where status = 'accepted'), 0);
select test.as_user('00000000-0000-0000-0000-0000000000a2');
update friendships set status = 'accepted' where friend_a = 'p-irene' and friend_b = 'p-juhyae';
select test.expect('Irene accepted Juhyae', (select count(*) from friendships where status = 'accepted'), 1);
select test.as_user('00000000-0000-0000-0000-0000000000a4');
select test.expect('Becky cannot see the Irene–Juhyae friendship', (select count(*) from friendships), 0);
select test.as_user('00000000-0000-0000-0000-0000000000a3');
delete from friendships where friend_a = 'p-irene' and friend_b = 'p-juhyae';
select test.expect('Juhyae unfriended Irene', (select count(*) from friendships), 0);

-- "Nobody" means nobody: Irene turns friend requests off, and Juhyae (a
-- groupmate) can no longer ask.
select test.as_user('00000000-0000-0000-0000-0000000000a2');
update friends set friend_requests_from = 'nobody' where id = 'p-irene';
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select test.refused('Juhyae cannot ask Irene once Irene takes no requests', $$insert into friendships (friend_a, friend_b, requested_by, status) values ('p-irene', 'p-juhyae', 'p-juhyae', 'pending')$$);
select test.as_user('00000000-0000-0000-0000-0000000000a2');
update friends set friend_requests_from = 'groups' where id = 'p-irene';

-- Claiming: only with the right invite code.
select test.as_user('00000000-0000-0000-0000-0000000000a6');   -- Albert, from Irene's link
select test.expect('An account with no profile yet sees nothing', (select count(*) from books), 0);
select test.expect('Unclaimed list needs the right code', (select count(*) from unclaimed_in_group('wrong')), 0);
select test.refused('Wrong code cannot claim Albert', $$select claim_profile('p-albert', 'wrong')$$);
select test.expect('Albert sees himself in the Living room list', (select count(*) from unclaimed_in_group(:'room_code') where id = 'p-albert'), 1);
select test.expect('Albert claims his profile', (select count(*) from (select claim_profile('p-albert', :'room_code')) c), 1);
select test.expect('Albert now sees the Living room book', (select count(*) from books where id = 'b-room'), 1);

-- Leaving.
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select leave_group('g-real');
select test.expect('Juhyae sees only the sample club after leaving', (select count(*) from books), 5);

reset role;
select 'ALL GROUP TESTS PASSED';
