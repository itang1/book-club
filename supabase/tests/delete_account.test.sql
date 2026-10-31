-- Delete my account: history survives anonymised, the account goes, and
-- someone holding or lending a copy is asked to deal with it first.
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
create or replace function test.refused(label text, statement text) returns text
language plpgsql as $$
begin
  begin execute statement; exception when others then return 'ok  ' || label; end;
  raise exception 'FAIL %: was allowed', label;
end $$;
grant usage on schema test to authenticated;
grant execute on all functions in schema test to authenticated;

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000d1', 'ana@x'),
  ('00000000-0000-0000-0000-0000000000d2', 'ben@x'),
  ('00000000-0000-0000-0000-0000000000d3', 'cleo@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000d1');
insert into friends (id, name, city, state, user_id) values ('d-ana', 'Ana', 'Austin', 'TX', '00000000-0000-0000-0000-0000000000d1');
select create_group('g-d', 'Delete club');
reset role;
select invite_code as code from groups where id = 'g-d' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000d2');
insert into friends (id, name, city, state, user_id) values ('d-ben', 'Ben', 'Boise', 'ID', '00000000-0000-0000-0000-0000000000d2');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-0000000000d3');
insert into friends (id, name, city, state, user_id) values ('d-cleo', 'Cleo', 'Cary', 'NC', '00000000-0000-0000-0000-0000000000d3');
select join_group(:'code');

-- Ana lends, Ben reads it, then Cleo does.
select test.as_user('00000000-0000-0000-0000-0000000000d1');
select lend_book('d-book', 'Emma', 'Jane Austen', '#000', 'd-leg-1', null, 'g-d');
select test.as_user('00000000-0000-0000-0000-0000000000d2');
insert into reading_queue (book_id, friend_id, position, status) values ('d-book', 'd-ben', 1, 'waiting');
select test.as_user('00000000-0000-0000-0000-0000000000d1');
select pass_on('d-leg-2', 'd-book', 'd-ben', null, null);

select test.as_user('00000000-0000-0000-0000-0000000000d1');
select test.refused('Ana still has a copy travelling', 'select delete_my_account()');
select test.as_user('00000000-0000-0000-0000-0000000000d2');
select test.refused('Ben is holding it', 'select delete_my_account()');
reset role;

-- Ben passes it on to Cleo and gets his hands free.
update reading_queue set status = 'done' where friend_id = 'd-ben';
insert into reading_queue (book_id, friend_id, position, status) values ('d-book', 'd-cleo', 2, 'waiting');
insert into handoffs (id, book_id, from_friend, to_friend, place_city) values ('d-leg-3', 'd-book', 'd-ben', 'd-cleo', 'Cary');
insert into friendships (friend_a, friend_b) values ('d-ben', 'd-cleo');

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000d2');
select delete_my_account();
reset role;

select test.expect('Bens sign-in is gone', (select count(*) from auth.users where email = 'ben@x'), 0);
select test.expect('His stops stay on the journey', (select count(*) from handoffs where book_id = 'd-book'), 3);
select test.expect('...under a name that says nothing', (select count(*) from friends where id = 'd-ben' and name = 'A reader' and user_id is null), 1);
select test.expect('...with his city kept', (select count(*) from friends where id = 'd-ben' and city = 'Boise'), 1);
select test.expect('He is in no group', (select count(*) from group_members where person_id = 'd-ben'), 0);
select test.expect('...no friendships', (select count(*) from friendships where friend_a = 'd-ben' or friend_b = 'd-ben'), 0);
select test.expect('...no queue places', (select count(*) from reading_queue where friend_id = 'd-ben'), 0);
select test.expect('Cleo is untouched', (select count(*) from friends where id = 'd-cleo' and name = 'Cleo'), 1);

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000d2');
select test.refused('A deleted account cannot do it twice', 'select delete_my_account()');
reset role;

select 'ALL DELETE ACCOUNT TESTS PASSED';
