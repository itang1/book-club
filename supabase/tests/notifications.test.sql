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

-- Emails start off for everyone; these people have turned them on.
insert into auth.users values
  ('00000000-0000-0000-0000-0000000000c1', 'nia@x'),
  ('00000000-0000-0000-0000-0000000000c2', 'oli@x'),
  ('00000000-0000-0000-0000-0000000000c3', 'pip@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c1');
insert into friends (id, name, city, state, user_id, email_book_arrived, email_new_book, email_book_sent, email_next_in_line, email_friend_request, email_reminders) values ('n-nia', 'Nia', 'Denver', 'CO', '00000000-0000-0000-0000-0000000000c1', true, true, true, true, true, true);
select create_group('g-n', 'Email club');
reset role;
select invite_code as code from groups where id = 'g-n' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c2');
insert into friends (id, name, city, state, user_id, email_new_book, email_book_sent, email_book_arrived, email_next_in_line, email_friend_request, email_reminders) values ('n-oli', 'Oli', 'Omaha', 'NE', '00000000-0000-0000-0000-0000000000c2', true, true, true, true, true, true);
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-0000000000c3');
insert into friends (id, name, city, state, user_id, email_new_book, email_book_sent, email_book_arrived, email_next_in_line, email_friend_request, email_reminders) values ('n-pip', 'Pip', 'Provo', 'UT', '00000000-0000-0000-0000-0000000000c3', true, true, true, false, true, true);
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
select test.expect('Nia opted in, so she is told it arrived', (select count(*) from notifications where person_id = 'n-nia' and kind = 'book_arrived' and about_person = 'n-oli'), 1);
select test.expect('Next-in-line is opt-in, so Pip gets none', (select count(*) from notifications where person_id = 'n-pip' and kind = 'next_in_line'), 0);
select test.expect('Nia is told Oli asked to be friends', (select count(*) from notifications where person_id = 'n-nia' and kind = 'friend_request'), 1);

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c1');
do $$ begin
  perform 1 from notifications;
  raise exception 'FAIL: the outbox is readable';
exception when insufficient_privilege then raise notice 'ok  Nobody can read the outbox';
end $$;
reset role;

-- Reminders: rare, and only when they help.
select queue_reminders();
select test.expect('A fresh read gets no nudge', (select count(*) from notifications where kind = 'still_reading'), 0);
update handoffs set happened_at = now() - interval '50 days' where id = 'n-leg-1';
update handoffs set happened_at = now() - interval '40 days', received_at = now() - interval '35 days' where id = 'n-leg-2';
select queue_reminders();
select test.expect('Five weeks in, with Pip waiting, Oli gets one nudge',
  (select count(*) from notifications where person_id = 'n-oli' and kind = 'still_reading' and about_person = 'n-pip'), 1);
select queue_reminders();
select test.expect('Once per stay', (select count(*) from notifications where kind = 'still_reading'), 1);

set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000c1');
select lend_book('n-book2', 'Persuasion', 'Jane Austen', '#000', 'n2-leg-1', null, 'g-n');
select lend_book('n-book3', 'Sanditon', 'Jane Austen', '#000', 'n3-leg-1', null, 'g-n');
select test.as_user('00000000-0000-0000-0000-0000000000c3');
insert into reading_queue (book_id, friend_id, position, status) values ('n-book2', 'n-pip', 1, 'waiting');
select test.as_user('00000000-0000-0000-0000-0000000000c2');
insert into reading_queue (book_id, friend_id, position, status) values ('n-book3', 'n-oli', 1, 'waiting');
select test.as_user('00000000-0000-0000-0000-0000000000c1');
select pass_on('n2-leg-2', 'n-book2', 'n-pip', null, null);
select pass_on('n3-leg-2', 'n-book3', 'n-oli', null, null);
reset role;
update handoffs set happened_at = now() - interval '10 days' where id in ('n2-leg-1', 'n3-leg-1');
update handoffs set happened_at = now() - interval '6 days' where id in ('n2-leg-2', 'n3-leg-2');
select queue_reminders();
select queue_reminders();
select test.expect('Got it untapped for six days: Pip is asked once',
  (select count(*) from notifications where person_id = 'n-pip' and kind = 'arrival_check'), 1);
select test.expect('Oli had a reminder this month, so he waits',
  (select count(*) from notifications where person_id = 'n-oli' and kind = 'arrival_check'), 0);

-- Retries: only rows that haven't used up their attempts and are due again are picked up.
insert into notifications (person_id, kind, attempts, next_attempt_at, error)
  values ('n-pip', 'friend_request', 1, now() + interval '5 minutes', 'smtp down');
select test.expect('A failed send waits for its retry time',
  (select count(*) from notifications where sent_at is null and attempts < 3
     and (next_attempt_at is null or next_attempt_at <= now()) and error = 'smtp down'), 0);
update notifications set next_attempt_at = now() - interval '1 minute' where error = 'smtp down';
select test.expect('...and is picked up once due',
  (select count(*) from notifications where sent_at is null and attempts < 3
     and (next_attempt_at is null or next_attempt_at <= now()) and error = 'smtp down'), 1);
update notifications set attempts = 3 where error = 'smtp down';
select test.expect('...but not after three tries',
  (select count(*) from notifications where sent_at is null and attempts < 3
     and (next_attempt_at is null or next_attempt_at <= now()) and error = 'smtp down'), 0);

-- Quiet by default: someone new has every email off until they choose.
insert into friends (id, name, city, state) values ('n-new', 'Newcomer', 'Nome', 'AK');
select test.expect('A newcomer starts with every email off',
  (select count(*) from friends where id = 'n-new'
     and not (email_new_book or email_book_sent or email_book_arrived
              or email_next_in_line or email_friend_request or email_reminders)), 1);
select test.expect('The one-time switch-off is recorded, so deploys never repeat it',
  (select count(*) from applied_once where name = 'emails-off-2026-10'), 1);

select 'ALL NOTIFICATION TESTS PASSED';
