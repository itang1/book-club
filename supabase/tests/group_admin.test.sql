-- Running a group: only the person at its helm can rename it, remove a
-- member, hand it over or reset its invite link.
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
  ('00000000-0000-0000-0000-000000000201', 'ann@x'),
  ('00000000-0000-0000-0000-000000000202', 'ben@x'),
  ('00000000-0000-0000-0000-000000000203', 'cy@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000201');
insert into friends (id, name, city, state, user_id) values ('a-ann', 'Ann', 'Austin', 'TX', '00000000-0000-0000-0000-000000000201');
select create_group('g-a', 'Porch readers');
select lend_book('a-book', 'Emma', 'Jane Austen', '#000', 'a-leg-1', null, 'g-a');
reset role;
select invite_code as code from groups where id = 'g-a' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000202');
insert into friends (id, name, city, state, user_id) values ('a-ben', 'Ben', 'Boston', 'MA', '00000000-0000-0000-0000-000000000202');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-000000000203');
insert into friends (id, name, city, state, user_id) values ('a-cy', 'Cy', 'Chicago', 'IL', '00000000-0000-0000-0000-000000000203');
select join_group(:'code');
insert into reading_queue (book_id, friend_id, position, status) values ('a-book', 'a-cy', 1, 'waiting');

select test.check('Members see who runs it', (select g.admin_id from groups g where id = 'g-a') = 'a-ann');
select test.check('Nobody runs a sample group',
  not exists (select 1 from groups g where g.is_sample and g.admin_id is not null));

select test.as_user('00000000-0000-0000-0000-000000000202');
select test.refused('Ben cannot rename it', $$select rename_group('g-a', 'Mine now')$$);
select test.refused('Ben cannot remove Cy', $$select remove_from_group('g-a', 'a-cy')$$);
select test.refused('Ben cannot take it over', $$select hand_over_group('g-a', 'a-ben')$$);
select test.refused('Ben cannot reset the link', $$select reset_invite_code('g-a')$$);
select test.refused('Nobody calls the admin check directly', $$select require_group_admin('g-a')$$);

select test.as_user('00000000-0000-0000-0000-000000000201');
select rename_group('g-a', '  Porch & Paper  ');
select test.check('Ann renames it', (select name from groups where id = 'g-a') = 'Porch & Paper');
select test.refused('Not to nothing', $$select rename_group('g-a', '  ')$$);
select reset_invite_code('g-a') as new_code \gset
select test.check('A reset makes a new code', :'new_code' <> :'code');
select test.check('...that the group has', (select invite_code from groups where id = 'g-a') = :'new_code');

select test.refused('Ann cannot remove herself', $$select remove_from_group('g-a', 'a-ann')$$);
select remove_from_group('g-a', 'a-cy');
select test.check('Cy is out of the group',
  not exists (select 1 from group_members where group_id = 'g-a' and person_id = 'a-cy'));
reset role;
select test.check('...and off its waiting lines',
  not exists (select 1 from reading_queue where friend_id = 'a-cy'));
set role authenticated;

select test.as_user('00000000-0000-0000-0000-000000000203');
select test.refused('The old link no longer works', format('select join_group(%L)', :'code'));
select test.check('Cy no longer sees the group', not exists (select 1 from groups where id = 'g-a'));
select test.check('Cy cannot ask who runs it', public.group_admin('g-a') is null);

select test.as_user('00000000-0000-0000-0000-000000000201');
select test.refused('Only to a member', $$select hand_over_group('g-a', 'a-cy')$$);
select hand_over_group('g-a', 'a-ben');
select test.check('Ben runs it now', (select g.admin_id from groups g where id = 'g-a') = 'a-ben');
select test.refused('Ann no longer can rename it', $$select rename_group('g-a', 'Back')$$);

select test.as_user('00000000-0000-0000-0000-000000000202');
select leave_group('g-a');
select test.as_user('00000000-0000-0000-0000-000000000201');
select test.check('When Ben leaves, the longest member runs it',
  (select g.admin_id from groups g where id = 'g-a') = 'a-ann');
select rename_group('g-a', 'Porch readers');

reset role;
select 'ALL GROUP ADMIN TESTS PASSED';
