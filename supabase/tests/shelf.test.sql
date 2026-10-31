-- Bookshelves: seen by people who share a group, edited only by the owner,
-- requests go through the function, lending turns a shelf book into a real one.
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
  execute statement;
  raise exception 'FAIL %: it was allowed', label;
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  return 'ok  ' || label;
end $$;
grant usage on schema test to authenticated;
grant execute on all functions in schema test to authenticated;

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000f1', 'sam@x'),
  ('00000000-0000-0000-0000-0000000000f2', 'tia@x'),
  ('00000000-0000-0000-0000-0000000000f3', 'uma@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000f1');
insert into friends (id, name, city, state, user_id) values ('s-sam', 'Sam', 'Salem', 'OR', '00000000-0000-0000-0000-0000000000f1');
select create_group('g-s', 'Shelf club');
reset role;
select invite_code as code from groups where id = 'g-s' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000f2');
insert into friends (id, name, city, state, user_id) values ('s-tia', 'Tia', 'Tulsa', 'OK', '00000000-0000-0000-0000-0000000000f2');
select join_group(:'code');
-- Uma shares no group with Sam.
select test.as_user('00000000-0000-0000-0000-0000000000f3');
insert into friends (id, name, city, state, user_id) values ('s-uma', 'Uma', 'Utica', 'NY', '00000000-0000-0000-0000-0000000000f3');

select test.as_user('00000000-0000-0000-0000-0000000000f1');
insert into shelf_books (id, owner_id, title, author) values ('sh-1', 's-sam', 'Middlemarch', 'George Eliot');
insert into shelf_books (id, owner_id, title, author) values ('sh-2', 's-sam', 'Persuasion', 'Jane Austen');
select test.refused('Sam cannot shelve a book as Tia',
  $$insert into shelf_books (id, owner_id, title) values ('sh-x', 's-tia', 'Forged')$$);

select test.as_user('00000000-0000-0000-0000-0000000000f2');
select test.expect('Tia, in Sams group, sees his shelf', (select count(*) from shelf_books where owner_id = 's-sam'), 2);
select test.as_user('00000000-0000-0000-0000-0000000000f3');
select test.expect('Uma, in no shared group, sees nothing', (select count(*) from shelf_books), 0);
select test.refused('Uma cannot ask for his book', $$select request_shelf_book('rq-u', 'sh-1')$$);

select test.as_user('00000000-0000-0000-0000-0000000000f2');
update shelf_books set title = 'Hacked' where id = 'sh-1';
delete from shelf_books where id = 'sh-1';
select test.expect('Tia cannot edit or delete his shelf',
  (select count(*) from shelf_books where id = 'sh-1' and title = 'Middlemarch'), 1);
select request_shelf_book('rq-1', 'sh-1');
select test.expect('Tia sees her request', (select count(*) from shelf_requests), 1);
select test.refused('Tia cannot grant her own request', $$update shelf_requests set status = 'accepted'$$);
select test.refused('Tia cannot answer it either', $$select answer_shelf_request('rq-1', true)$$);

select test.as_user('00000000-0000-0000-0000-0000000000f1');
select test.expect('Sam sees the request on his book', (select count(*) from shelf_requests), 1);
select test.refused('Sam cannot ask for his own book', $$select request_shelf_book('rq-s', 'sh-1')$$);
select answer_shelf_request('rq-1', true);
reset role;
select test.expect('Yes is recorded', (select count(*) from shelf_requests where status = 'accepted'), 1);
select test.expect('Sam was emailed once', (select count(*) from notifications where kind = 'shelf_request' and person_id = 's-sam' and about_person = 's-tia'), 1);

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000f2');
select test.refused('Tia cannot lend Sams shelf book', $$select lend_from_shelf('sh-1', 'sb-1', 'sl-1', 'g-s')$$);
select test.as_user('00000000-0000-0000-0000-0000000000f1');
select lend_from_shelf('sh-1', 'sb-1', 'sl-1', 'g-s');
select test.expect('Lending makes a real book in the group', (select count(*) from books where id = 'sb-1' and title = 'Middlemarch' and group_id = 'g-s'), 1);
select test.expect('...and the shelf remembers it', (select count(*) from shelf_books where id = 'sh-1' and lent_book_id = 'sb-1'), 1);
select test.refused('It cannot be lent twice while travelling', $$select lend_from_shelf('sh-1', 'sb-2', 'sl-2', 'g-s')$$);
select test.as_user('00000000-0000-0000-0000-0000000000f2');
select test.refused('Nobody can ask for a copy that is out', $$select request_shelf_book('rq-2', 'sh-1')$$);
reset role;

select 'ALL SHELF TESTS PASSED';
