-- Block and report: a block stops friend requests and shelf asks both ways,
-- ends a friendship, and is visible only to whoever made it. Reports go in
-- and can't be read back.
\set ON_ERROR_STOP on
\set QUIET on

create schema if not exists test;
create or replace function test.as_user(uid text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false); end $$;
create or replace function test.check(label text, ok boolean) returns text language plpgsql as $$
begin
  if not ok then raise exception 'FAIL %', label; end if;
  return 'ok  ' || label;
end $$;
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

-- Bo runs a group with Cy and Di; Ed is in no group with anyone.
insert into auth.users values
  ('00000000-0000-0000-0000-000000000401', 'bo@x'),
  ('00000000-0000-0000-0000-000000000402', 'cy@x'),
  ('00000000-0000-0000-0000-000000000403', 'di@x'),
  ('00000000-0000-0000-0000-000000000404', 'ed@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000401');
insert into friends (id, name, city, state, user_id) values ('b-bo', 'Bo', 'Austin', 'TX', '00000000-0000-0000-0000-000000000401');
select create_group('g-b', 'Blockers');
insert into shelf_books (id, owner_id, title) values ('b-sh', 'b-bo', 'Middlemarch');
reset role;
select invite_code as code from groups where id = 'g-b' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000402');
insert into friends (id, name, city, state, user_id) values ('b-cy', 'Cy', 'Boston', 'MA', '00000000-0000-0000-0000-000000000402');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-000000000403');
insert into friends (id, name, city, state, user_id) values ('b-di', 'Di', 'Denver', 'CO', '00000000-0000-0000-0000-000000000403');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-000000000404');
insert into friends (id, name, city, state, user_id) values ('b-ed', 'Ed', 'Erie', 'PA', '00000000-0000-0000-0000-000000000404');

-- Cy asks Bo to be friends and to borrow his book; Bo blocks Cy.
select test.as_user('00000000-0000-0000-0000-000000000402');
insert into friendships (friend_a, friend_b, requested_by, status) values ('b-bo', 'b-cy', 'b-cy', 'pending');
select request_shelf_book('b-req', 'b-sh');
select test.as_user('00000000-0000-0000-0000-000000000401');
select block_person('b-cy');
select test.check('Bo sees his block', exists (select 1 from blocks where blocked = 'b-cy'));
select test.check('The friend request went with it', not exists (select 1 from friendships where 'b-cy' in (friend_a, friend_b)));
select test.check('...and so did the ask to borrow', not exists (select 1 from shelf_requests where id = 'b-req'));
select test.refused('Bo cannot ask Cy to be friends now',
  $$insert into friendships (friend_a, friend_b, requested_by, status) values ('b-bo', 'b-cy', 'b-bo', 'pending')$$);
select test.refused('Bo cannot block someone he cannot see', $$select block_person('b-ed')$$);
select test.refused('Nor himself', $$select block_person('b-bo')$$);

select test.as_user('00000000-0000-0000-0000-000000000402');
select test.check('Cy cannot see that she is blocked', not exists (select 1 from blocks));
select test.refused('Cy cannot ask Bo to be friends',
  $$insert into friendships (friend_a, friend_b, requested_by, status) values ('b-bo', 'b-cy', 'b-cy', 'pending')$$);
select test.check('Bo''s shelf is hidden from Cy', not exists (select 1 from shelf_books where owner_id = 'b-bo'));
select test.refused('...and she cannot ask for his book', $$select request_shelf_book('b-req2', 'b-sh')$$);
select test.refused('...or delete the block', $$delete from blocks$$);
select unblock_person('b-bo');
select test.as_user('00000000-0000-0000-0000-000000000401');
select test.check('Cy cannot lift Bo''s block', exists (select 1 from blocks where blocked = 'b-cy'));

-- Di is unaffected.
select test.as_user('00000000-0000-0000-0000-000000000403');
select test.check('Di still sees Bo''s shelf', exists (select 1 from shelf_books where owner_id = 'b-bo'));
insert into friendships (friend_a, friend_b, requested_by, status) values ('b-bo', 'b-di', 'b-di', 'pending');
select test.check('...and can ask him to be friends', exists (select 1 from friendships where requested_by = 'b-di'));

-- Unblocking puts things back as they were before (minus what was cleared).
select test.as_user('00000000-0000-0000-0000-000000000401');
select unblock_person('b-cy');
select test.check('Bo has lifted the block', not exists (select 1 from blocks));
select test.as_user('00000000-0000-0000-0000-000000000402');
select test.check('Cy sees the shelf again', exists (select 1 from shelf_books where owner_id = 'b-bo'));

-- Reports.
select test.as_user('00000000-0000-0000-0000-000000000403');
select report_person('b-cy', 'unkind', '  Rude in a letter  ');
select test.refused('Di cannot read reports', $$select * from reports$$);
select test.refused('Nor report someone she cannot see', $$select report_person('b-ed', 'other', '')$$);
select test.refused('Nor give a made-up reason', $$select report_person('b-cy', 'boring', '')$$);
select report_person('b-cy', 'other', null) from generate_series(1, 9);
select test.refused('Ten a day is the most', $$select report_person('b-cy', 'other', null)$$);
reset role;
select test.check('The reports were kept, trimmed',
  (select count(*) from reports where reporter = 'b-di') = 10
  and exists (select 1 from reports where details = 'Rude in a letter'));
select 'ALL BLOCK AND REPORT TESTS PASSED';
