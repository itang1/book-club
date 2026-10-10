-- One-tap email buttons: each link does its one thing, once, for its one person.
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
create or replace function test.expect_text(label text, actual text, expected text) returns text
language plpgsql as $$
begin
  if actual is distinct from expected then raise exception 'FAIL %: got %, expected %', label, actual, expected; end if;
  return 'ok  ' || label;
end $$;
grant usage on schema test to anon, authenticated;
grant execute on all functions in schema test to anon, authenticated;

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000e1', 'ada@x'),
  ('00000000-0000-0000-0000-0000000000e2', 'bo@x'),
  ('00000000-0000-0000-0000-0000000000e3', 'cy@x');
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000e1');
insert into friends (id, name, city, state, user_id) values ('e-ada', 'Ada Lane', 'Austin', 'TX', '00000000-0000-0000-0000-0000000000e1');
select create_group('g-e', 'Button club');
reset role;
select invite_code as code from groups where id = 'g-e' \gset
set role authenticated;
select test.as_user('00000000-0000-0000-0000-0000000000e2');
insert into friends (id, name, city, state, user_id) values ('e-bo', 'Bo Park', 'Boise', 'ID', '00000000-0000-0000-0000-0000000000e2');
select join_group(:'code');
select test.as_user('00000000-0000-0000-0000-0000000000e3');
insert into friends (id, name, city, state, user_id, email_new_book) values ('e-cy', 'Cy Moss', 'Cody', 'WY', '00000000-0000-0000-0000-0000000000e3', false);
select join_group(:'code');

-- Ada lends; Bo signs up; Ada sends it to Bo. Bo asks Ada to be friends.
select test.as_user('00000000-0000-0000-0000-0000000000e1');
select lend_book('e-book', 'Persuasion', 'Jane Austen', '#000', 'e-leg-1', null, 'g-e');
select lend_book('e-book-2', 'Middlemarch', 'George Eliot', '#000', 'e-leg-2', null, 'g-e');
select test.as_user('00000000-0000-0000-0000-0000000000e2');
insert into reading_queue (book_id, friend_id, position, status) values ('e-book', 'e-bo', 1, 'waiting');
insert into friendships (friend_a, friend_b, requested_by, status) values ('e-ada', 'e-bo', 'e-bo', 'pending');
select test.as_user('00000000-0000-0000-0000-0000000000e1');
select pass_on('e-leg-3', 'e-book', 'e-bo', null, null);
reset role;

select test.expect('Bo hears about the new book', (select count(*) from notifications where person_id = 'e-bo' and kind = 'new_book' and book_id = 'e-book'), 1);
select test.expect('Ada lent it, so Ada does not', (select count(*) from notifications where person_id = 'e-ada' and kind = 'new_book'), 0);
select test.expect('Cy turned new-book emails off', (select count(*) from notifications where person_id = 'e-cy' and kind = 'new_book'), 0);

insert into email_actions (token_hash, person_id, action, book_id, about_person) values
  (email_action_hash('tok-got'), 'e-bo', 'got_it', 'e-book', 'e-ada'),
  (email_action_hash('tok-join'), 'e-cy', 'join_line', 'e-book-2', 'e-ada'),
  (email_action_hash('tok-join-again'), 'e-cy', 'join_line', 'e-book-2', 'e-ada'),
  (email_action_hash('tok-friend'), 'e-ada', 'accept_friend', null, 'e-bo');
insert into friends (id, name, city, state) values ('e-dee', 'Dee Outside', 'Dover', 'DE');
insert into email_actions (token_hash, person_id, action, book_id, about_person) values
  (email_action_hash('tok-outsider'), 'e-dee', 'join_line', 'e-book-2', 'e-ada'),
  (email_action_hash('tok-holder'), 'e-ada', 'join_line', 'e-book-2', 'e-ada');
insert into email_actions (token_hash, person_id, action, book_id, about_person, created_at) values
  (email_action_hash('tok-old'), 'e-bo', 'got_it', 'e-book', 'e-ada', now() - interval '31 days');

-- From the email, nobody signed in.
set role anon;
select test.expect_text('Preview says what Got it is for', email_action_preview('tok-got')->>'title', 'Persuasion');
select test.expect_text('Preview gives a first name only', email_action_preview('tok-got')->>'about', 'Ada');
select test.expect_text('A made-up token is unknown', email_action_preview('tok-nope')->>'state', 'unknown');
select test.expect_text('Got it works from the email', redeem_email_action('tok-got'), 'done');
select test.expect_text('The same link a second time', redeem_email_action('tok-got'), 'already');
select test.expect_text('An old link has expired', redeem_email_action('tok-old'), 'expired');
select test.expect_text('Join the line works from the email', redeem_email_action('tok-join'), 'done');
select test.expect_text('Joining twice changes nothing', redeem_email_action('tok-join-again'), 'already');
select test.expect_text('Accept works from the email', redeem_email_action('tok-friend'), 'done');
select test.expect_text('Someone outside the group cannot join its line', redeem_email_action('tok-outsider'), 'already');
select test.expect_text('Whoever holds it does not join its line', redeem_email_action('tok-holder'), 'already');
do $$ begin
  perform 1 from email_actions;
  raise exception 'FAIL: email actions are readable';
exception when insufficient_privilege then raise notice 'ok  Nobody can read the email actions';
end $$;
reset role;

select test.expect('Bo has it now', (select count(*) from handoffs where id = 'e-leg-3' and received_at is not null and place_city = 'Boise'), 1);
select test.expect('Ada hears it arrived', (select count(*) from notifications where person_id = 'e-ada' and kind = 'book_arrived'), 1);
select test.expect('Cy is in line for Middlemarch', (select count(*) from reading_queue where book_id = 'e-book-2' and friend_id = 'e-cy' and status = 'waiting'), 1);
select test.expect('Ada and Bo are friends', (select count(*) from friendships where friend_a = 'e-ada' and friend_b = 'e-bo' and status = 'accepted'), 1);
select test.expect('Only Cy joined Middlemarch''s line', (select count(*) from reading_queue where book_id = 'e-book-2' and friend_id <> 'e-ada'), 1);
select test.expect('Tokens are stored hashed', (select count(*) from email_actions where token_hash like 'tok-%'), 0);
select 'ALL EMAIL ACTION TESTS PASSED';
