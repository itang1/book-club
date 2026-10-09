-- Groups and friend requests: nothing leaks between groups, and nobody acts as someone else.
\set ON_ERROR_STOP on
\set QUIET on
-- Helpers: act as someone, and check a count.
create schema if not exists test;
create or replace function test.as_user(uid text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false); end $$;
create or replace function test.expect(label text, actual bigint, expected bigint) returns text
language plpgsql as $$
begin
  if actual <> expected then raise exception 'FAIL %: got %, expected %', label, actual, expected; end if;
  return 'ok  ' || label;
end $$;

-- The demo crew are "group-pants" (seed.example.sql). Give Lena an account.
insert into auth.users values ('00000000-0000-0000-0000-0000000000a1', 'lena@x'),
  ('00000000-0000-0000-0000-0000000000a2', 'irene@x'), ('00000000-0000-0000-0000-0000000000a3', 'juhyae@x');
update friends set user_id = '00000000-0000-0000-0000-0000000000a1' where id = 'friend-lena';
grant usage on schema test to authenticated;
grant execute on all functions in schema test to authenticated;

-- Irene and Juhyae sign up and make profiles; Irene starts her own group.
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000a2');
insert into friends (id, name, city, state, user_id) values ('p-irene', 'Irene', 'Los Angeles', 'CA', '00000000-0000-0000-0000-0000000000a2');
select create_group('g-real', 'Real club');
select test.as_user('00000000-0000-0000-0000-0000000000a3');
insert into friends (id, name, city, state, user_id) values ('p-juhyae', 'Juhyae', 'St. Louis', 'MO', '00000000-0000-0000-0000-0000000000a3');
reset role;
select invite_code as real_code from groups where id = 'g-real' \gset
select invite_code as pants_code from groups where id = 'group-pants' \gset
set role authenticated;
select join_group(:'real_code');                                   -- Juhyae joins Irene's group
select test.as_user('00000000-0000-0000-0000-0000000000a2');
select lend_book('b-real', 'Discerning the Voice of God', 'Priscilla Shirer', '#000', 'h-real', 'Claire', 'g-real');
select join_group(:'pants_code');                                   -- Irene is in both groups

-- What each person can see.
select test.as_user('00000000-0000-0000-0000-0000000000a1');   -- Lena (club only)
select test.expect('Lena sees the 4 club books, not the real-club one', (select count(*) from books), 4);
select test.expect('Lena cannot see Juhyae', (select count(*) from friends where id = 'p-juhyae'), 0);
select test.expect('Lena sees Irene (shared group)', (select count(*) from friends where id = 'p-irene'), 1);
select test.expect('Lena cannot see the real-club group', (select count(*) from groups where id = 'g-real'), 0);
select test.expect('Lena cannot see real-club members', (select count(*) from group_members where group_id = 'g-real'), 0);
select test.expect('Lena sees no real-club history', (select count(*) from handoffs where book_id = 'b-real'), 0);
do $$ begin
  insert into reading_queue (book_id, friend_id, position, status) values ('b-real', 'friend-lena', 9, 'waiting');
  raise exception 'FAIL: Lena joined a line in a group she is not in';
exception when insufficient_privilege then raise notice 'ok  Lena cannot join the real-club line';
end $$;
do $$ begin
  insert into friendships (friend_a, friend_b, requested_by, status) values ('friend-lena', 'p-juhyae', 'friend-lena', 'pending');
  raise exception 'FAIL: Lena sent a request to someone she cannot see';
exception when insufficient_privilege then raise notice 'ok  Lena cannot friend-request Juhyae';
end $$;
-- Lena asks Irene (a groupmate): pending.
insert into friendships (friend_a, friend_b, requested_by, status) values ('friend-lena', 'p-irene', 'friend-lena', 'pending');
do $$ begin
  update friendships set status = 'accepted' where friend_a = 'friend-lena' and friend_b = 'p-irene';
  if found then raise exception 'FAIL: Lena accepted her own request'; end if;
  raise notice 'ok  Lena cannot accept her own request';
end $$;

select test.as_user('00000000-0000-0000-0000-0000000000a2');   -- Irene accepts
update friendships set status = 'accepted' where friend_a = 'friend-lena' and friend_b = 'p-irene';
select test.expect('Irene sees the books in both her groups', (select count(*) from books), 5);
select test.expect('Irene accepted Lena', (select count(*) from friendships where status = 'accepted' and 'p-irene' in (friend_a, friend_b)), 1);

select test.as_user('00000000-0000-0000-0000-0000000000a3');   -- Juhyae (real club only)
select test.expect('Juhyae sees only the real-club book', (select count(*) from books), 1);
select test.expect('Juhyae cannot see Lena, even though Lena is Irene''s friend', (select count(*) from friends where id = 'friend-lena'), 0);
select test.expect('Juhyae cannot see the Lena–Irene friendship', (select count(*) from friendships), 0);
select test.expect('Juhyae sees Claire''s gift', (select count(*) from books where gifted_by = 'Claire'), 1);

-- Claiming: only with the right invite code.
reset role;
insert into friends (id, name, city, state) values ('p-becky', 'Becky', 'Seattle', 'WA');
insert into group_members values ('g-real', 'p-becky');
insert into auth.users values ('00000000-0000-0000-0000-0000000000a4', 'becky@x'), ('00000000-0000-0000-0000-0000000000a5', 'stranger@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000a5');   -- a stranger, no code
select test.expect('A stranger sees nobody', (select count(*) from friends), 0);
select test.expect('A stranger sees no books', (select count(*) from books), 0);
select test.expect('Unclaimed list needs the right code', (select count(*) from unclaimed_in_group('wrong')), 0);
do $$ begin
  perform claim_profile('p-becky', 'wrong');
  raise exception 'FAIL: claimed Becky with the wrong code';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  wrong code cannot claim Becky';
end $$;
select test.as_user('00000000-0000-0000-0000-0000000000a4');   -- Becky, from Irene's link
select test.expect('Becky sees herself in the unclaimed list', (select count(*) from unclaimed_in_group(:'real_code') where id = 'p-becky'), 1);
select test.expect('Becky claims her profile', (select count(*) from (select claim_profile('p-becky', :'real_code')) c), 1);
select test.expect('Becky now sees the real-club book', (select count(*) from books), 1);

-- Leaving: Juhyae leaves and stops seeing it.
select test.as_user('00000000-0000-0000-0000-0000000000a3');
select leave_group('g-real');
select test.expect('Juhyae sees nothing after leaving', (select count(*) from books), 0);

-- Unfriend: either side deletes, quietly.
select test.as_user('00000000-0000-0000-0000-0000000000a1');
delete from friendships where friend_a = 'friend-lena' and friend_b = 'p-irene';
select test.expect('Lena unfriended Irene', (select count(*) from friendships where friend_a = 'friend-lena' and friend_b = 'p-irene'), 0);
reset role;
select 'ALL GROUP TESTS PASSED';
