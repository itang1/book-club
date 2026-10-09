-- Emails: the right person is queued for the right thing, and only if
-- they want it.
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
grant usage on schema test to authenticated;
grant execute on all functions in schema test to authenticated;

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000c1', 'nia@x'),
  ('00000000-0000-0000-0000-0000000000c2', 'oli@x'),
  ('00000000-0000-0000-0000-0000000000c3', 'pip@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c1');
insert into friends (id, name, city, state, user_id) values ('n-nia', 'Nia', 'Denver', 'CO', '00000000-0000-0000-0000-0000000000c1');
select create_group('g-n', 'Email club');
reset role;
select invite_code as code from groups where id = 'g-n' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c2');
insert into friends (id, name, city, state, user_id) values ('n-oli', 'Oli', 'Omaha', 'NE', '00000000-0000-0000-0000-0000000000c2');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-0000000000c3');
insert into friends (id, name, city, state, user_id, email_next_in_line) values ('n-pip', 'Pip', 'Provo', 'UT', '00000000-0000-0000-0000-0000000000c3', false);
select join_group(:'code');

-- Nia lends; Oli and Pip sign up; Nia sends it to Oli; Oli says Got it.
select test.as_user('00000000-0000-0000-0000-0000000000c1');
select lend_book('n-book', 'Emma', 'Jane Austen', '#000', 'n-leg-1', null, 'g-n');
select test.as_user('00000000-0000-0000-0000-0000000000c2');
insert into reading_queue (book_id, friend_id, position, status) values ('n-book', 'n-oli', 1, 'waiting');
select test.as_user('00000000-0000-0000-0000-0000000000c3');
insert into reading_queue (book_id, friend_id, position, status) values ('n-book', 'n-pip', 2, 'waiting');
select test.as_user('00000000-0000-0000-0000-0000000000c1');
select pass_on('n-leg-2', 'n-book', 'n-oli', null, null);
select test.as_user('00000000-0000-0000-0000-0000000000c2');
select mark_received('n-book');
-- Oli asks Nia to be friends.
insert into friendships (friend_a, friend_b, requested_by, status) values ('n-nia', 'n-oli', 'n-oli', 'pending');
reset role;

select test.expect('Lending queues nothing', (select count(*) from notifications where book_id = 'n-book' and kind = 'book_sent' and person_id = 'n-nia'), 0);
select test.expect('Oli is told it was sent to him', (select count(*) from notifications where person_id = 'n-oli' and kind = 'book_sent' and about_person = 'n-nia'), 1);
select test.expect('Nia is told it arrived', (select count(*) from notifications where person_id = 'n-nia' and kind = 'book_arrived' and about_person = 'n-oli'), 1);
select test.expect('Pip turned off next-in-line emails, so none', (select count(*) from notifications where person_id = 'n-pip'), 0);
select test.expect('Nia is told Oli asked to be friends', (select count(*) from notifications where person_id = 'n-nia' and kind = 'friend_request'), 1);

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c1');
do $$ begin
  perform 1 from notifications;
  raise exception 'FAIL: the outbox is readable';
exception when insufficient_privilege then raise notice 'ok  Nobody can read the outbox';
end $$;
reset role;
select 'ALL NOTIFICATION TESTS PASSED';
