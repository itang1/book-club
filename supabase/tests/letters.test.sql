-- Letters (a note and stars left in the book) stay sealed until you've
-- finished the copy yourself, and that's enforced by the database, not just
-- hidden on screen.
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

-- Lia lends a book in her group, Mo reads it next, then Ned. Ola is in
-- another group altogether.
insert into auth.users values
  ('00000000-0000-0000-0000-000000000101', 'lia@x'),
  ('00000000-0000-0000-0000-000000000102', 'mo@x'),
  ('00000000-0000-0000-0000-000000000103', 'ned@x'),
  ('00000000-0000-0000-0000-000000000104', 'ola@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000101');
insert into friends (id, name, city, state, user_id) values ('l-lia', 'Lia', 'Austin', 'TX', '00000000-0000-0000-0000-000000000101');
select create_group('g-l', 'Letter club');
reset role;
select invite_code as code from groups where id = 'g-l' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-000000000102');
insert into friends (id, name, city, state, user_id) values ('l-mo', 'Mo', 'Boston', 'MA', '00000000-0000-0000-0000-000000000102');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-000000000103');
insert into friends (id, name, city, state, user_id) values ('l-ned', 'Ned', 'Chicago', 'IL', '00000000-0000-0000-0000-000000000103');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-000000000104');
insert into friends (id, name, city, state, user_id) values ('l-ola', 'Ola', 'Denver', 'CO', '00000000-0000-0000-0000-000000000104');
select create_group('g-l2', 'Elsewhere');

select test.as_user('00000000-0000-0000-0000-000000000101');
select lend_book('l-book', 'Persuasion', 'Jane Austen', '#000', 'l-leg-1', null, 'g-l');
select test.as_user('00000000-0000-0000-0000-000000000102');
insert into reading_queue (book_id, friend_id, position, status) values ('l-book', 'l-mo', 1, 'waiting');
select test.as_user('00000000-0000-0000-0000-000000000101');
select pass_on('l-leg-2', 'l-book', 'l-mo', 'Wait for the letter', 5::smallint);

-- Nobody reads the letter columns straight off the table.
select test.as_user('00000000-0000-0000-0000-000000000103');
select test.refused('Ned cannot select notes from handoffs', $$select note from handoffs$$);
select test.refused('Ned cannot select ratings from handoffs', $$select rating from handoffs$$);
select test.refused('Ned cannot select * from handoffs', $$select * from handoffs$$);
select test.check('Ned still sees the journey',
  (select count(*) from handoffs where book_id = 'l-book') = 2);
select test.check('Ned, who has not read it, opens no letters',
  not exists (select 1 from readable_letters()));

select test.as_user('00000000-0000-0000-0000-000000000101');
select test.check('Lia opens the letter she wrote',
  exists (select 1 from readable_letters() where handoff_id = 'l-leg-2'
          and note = 'Wait for the letter' and rating = 5));

select test.as_user('00000000-0000-0000-0000-000000000102');
select test.check('Mo, holding it, cannot open it before he finishes',
  not exists (select 1 from readable_letters()));
select mark_received('l-book');
select test.as_user('00000000-0000-0000-0000-000000000103');
insert into reading_queue (book_id, friend_id, position, status) values ('l-book', 'l-ned', 2, 'waiting');
select test.as_user('00000000-0000-0000-0000-000000000102');
select pass_on('l-leg-3', 'l-book', 'l-ned', 'Worth it', 4::smallint);
select test.check('Once Mo passes it on, he opens Lia''s letter and his own',
  (select count(*) from readable_letters()) = 2);

select test.as_user('00000000-0000-0000-0000-000000000103');
select test.check('Ned, holding it now, still opens none',
  not exists (select 1 from readable_letters()));

select test.as_user('00000000-0000-0000-0000-000000000104');
select test.check('Ola, outside the group, opens none',
  not exists (select 1 from readable_letters()));

reset role;
set role anon;
select test.refused('Signed-out visitors cannot call it', $$select * from public.readable_letters()$$);

reset role;
select 'ALL LETTER TESTS PASSED';
