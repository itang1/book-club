-- Sending a book and saying Got it: only the right people, and the log
-- can't be written directly.
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

-- Ana lends a book in her group; Bea is next; Cat is in the group but not
-- in line.
insert into auth.users values
  ('00000000-0000-0000-0000-0000000000b1', 'ana@x'),
  ('00000000-0000-0000-0000-0000000000b2', 'bea@x'),
  ('00000000-0000-0000-0000-0000000000b3', 'cat@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000b1');
insert into friends (id, name, city, state, user_id) values ('h-ana', 'Ana', 'Austin', 'TX', '00000000-0000-0000-0000-0000000000b1');
select create_group('g-h', 'Handoff club');
reset role;
select invite_code as code from groups where id = 'g-h' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000b2');
insert into friends (id, name, city, state, user_id) values ('h-bea', 'Bea', 'Boston', 'MA', '00000000-0000-0000-0000-0000000000b2');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-0000000000b3');
insert into friends (id, name, city, state, user_id) values ('h-cat', 'Cat', 'Chicago', 'IL', '00000000-0000-0000-0000-0000000000b3');
select join_group(:'code');

select test.as_user('00000000-0000-0000-0000-0000000000b1');
select lend_book('h-book', 'Middlemarch', 'George Eliot', '#000', 'h-leg-1', null, 'g-h');
select test.as_user('00000000-0000-0000-0000-0000000000b2');
insert into reading_queue (book_id, friend_id, position, status) values ('h-book', 'h-bea', 1, 'waiting');

-- Ana sends it to Bea: in the post, to be read in Boston.
select test.as_user('00000000-0000-0000-0000-0000000000b1');
select pass_on('h-leg-2', 'h-book', 'h-bea', 'Enjoy', 4::smallint);
select test.check('Sent: in the post to Bea, to be read in Boston',
  exists (select 1 from handoffs where id = 'h-leg-2' and received_at is null and place_city = 'Boston'));

-- Cat can't receive it or send it on.
select test.as_user('00000000-0000-0000-0000-0000000000b3');
select test.refused('Cat cannot say Got it for Bea''s book', $$select mark_received('h-book')$$);
select test.refused('Cat cannot send it on', $$select pass_on('h-x', 'h-book', 'h-cat', null, null)$$);
select test.refused('Cat cannot be sent a book she isn''t in line for',
  $$select pass_on('h-y', 'h-book', 'h-cat', null, null)$$);

-- Bea: Got it.
select test.as_user('00000000-0000-0000-0000-0000000000b2');
select mark_received('h-book');
select test.check('Got it marks it received', exists (select 1 from handoffs where id = 'h-leg-2' and received_at is not null));

-- Nobody writes to the log directly.
select test.refused('Direct inserts into the log are refused',
  $$insert into handoffs (id, book_id, to_friend) values ('h-z', 'h-book', 'h-bea')$$);

reset role;
select 'ALL HANDOFF TESTS PASSED';
