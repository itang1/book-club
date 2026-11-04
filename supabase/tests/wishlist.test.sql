-- A group's wishlist: members suggest and vote; nobody else sees it.
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

insert into auth.users values
  ('00000000-0000-0000-0000-000000000301', 'wes@x'),
  ('00000000-0000-0000-0000-000000000302', 'vi@x'),
  ('00000000-0000-0000-0000-000000000303', 'out@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000301');
insert into friends (id, name, city, state, user_id) values ('w-wes', 'Wes', 'Austin', 'TX', '00000000-0000-0000-0000-000000000301');
select create_group('g-w', 'Wishers');
reset role;
select invite_code as code from groups where id = 'g-w' \gset
select id as sample_id from groups where is_sample limit 1 \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000302');
insert into friends (id, name, city, state, user_id) values ('w-vi', 'Vi', 'Boston', 'MA', '00000000-0000-0000-0000-000000000302');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-000000000303');
insert into friends (id, name, city, state, user_id) values ('w-out', 'Out', 'Chicago', 'IL', '00000000-0000-0000-0000-000000000303');

select test.as_user('00000000-0000-0000-0000-000000000302');
insert into wishes (id, group_id, suggested_by, title, author) values ('wish-1', 'g-w', 'w-vi', 'Middlemarch', 'George Eliot');
insert into wish_votes (wish_id, person_id) values ('wish-1', 'w-vi');
select test.refused('Vi cannot suggest as Wes',
  $$insert into wishes (id, group_id, suggested_by, title) values ('wish-x', 'g-w', 'w-wes', 'Nope')$$);
select test.refused('Nor wish in a sample group',
  format($$insert into wishes (id, group_id, suggested_by, title) values ('wish-s', %L, 'w-vi', 'Nope')$$, :'sample_id'));
select test.refused('Nor wish for nothing',
  $$insert into wishes (id, group_id, suggested_by, title) values ('wish-e', 'g-w', 'w-vi', '  ')$$);

select test.as_user('00000000-0000-0000-0000-000000000301');
select test.check('Wes sees the wish', exists (select 1 from wishes where id = 'wish-1'));
insert into wish_votes (wish_id, person_id) values ('wish-1', 'w-wes');
select test.check('Two would read it', (select count(*) from wish_votes where wish_id = 'wish-1') = 2);
select test.refused('Wes cannot vote for someone else',
  $$insert into wish_votes (wish_id, person_id) values ('wish-1', 'w-out')$$);
delete from wish_votes where wish_id = 'wish-1' and person_id = 'w-vi';
select test.check('Wes cannot take back Vi''s vote',
  (select count(*) from wish_votes where wish_id = 'wish-1') = 2);

select test.as_user('00000000-0000-0000-0000-000000000303');
select test.check('Outsiders see no wishes', not exists (select 1 from wishes));
select test.check('...nor votes', not exists (select 1 from wish_votes));
select test.refused('...and cannot add one',
  $$insert into wishes (id, group_id, suggested_by, title) values ('wish-o', 'g-w', 'w-out', 'Hi')$$);
select test.refused('...or vote',
  $$insert into wish_votes (wish_id, person_id) values ('wish-1', 'w-out')$$);

select test.as_user('00000000-0000-0000-0000-000000000302');
insert into wishes (id, group_id, suggested_by, title) values ('wish-2', 'g-w', 'w-vi', 'Emma');
select test.as_user('00000000-0000-0000-0000-000000000301');
delete from wishes where id = 'wish-2';
select test.check('Whoever runs the group can take a wish down', not exists (select 1 from wishes where id = 'wish-2'));
select test.as_user('00000000-0000-0000-0000-000000000302');
select leave_group('g-w');
select test.check('Having left, Vi no longer sees it', not exists (select 1 from wishes));
select test.as_user('00000000-0000-0000-0000-000000000301');
select test.check('Her wish stays for the group', exists (select 1 from wishes where id = 'wish-1'));

reset role;
select 'ALL WISHLIST TESTS PASSED';
