-- Sending a book and saying Got it: only the right people, and the log can't be written directly.
\set ON_ERROR_STOP on
-- Accounts for the demo group (ids from seed.example.sql).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000b', 'bridget@x'),
  ('00000000-0000-0000-0000-00000000000c', 'tibby@x'),
  ('00000000-0000-0000-0000-00000000000d', 'lena@x');
update friends set user_id = '00000000-0000-0000-0000-00000000000b' where id = 'friend-bridget';
update friends set user_id = '00000000-0000-0000-0000-00000000000c' where id = 'friend-tibby';
update friends set user_id = '00000000-0000-0000-0000-00000000000d' where id = 'friend-lena';

-- Bridget holds book-2; Tibby is waiting. Bridget sends it.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pass_on('t-1', 'book-2', 'friend-tibby', 'Enjoy', 4::smallint);
reset role;
do $$ begin
  if not exists (select 1 from handoffs where id = 't-1' and received_at is null and place_city = 'Bethesda') then
    raise exception 'FAIL: the sent leg should be in the post, read in Bethesda';
  end if;
  raise notice 'ok  sent: in the post to Tibby in Bethesda';
end $$;

-- Lena (not the holder) can't mark it received, and can't send it on.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
do $$ begin
  perform mark_received('book-2');
  raise exception 'FAIL: Lena marked it received';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  Lena refused: %', sqlerrm;
end $$;
do $$ begin
  perform pass_on('t-x', 'book-2', 'friend-lena', null, null);
  raise exception 'FAIL: Lena passed it on';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  Lena refused: %', sqlerrm;
end $$;

-- Tibby: Got it.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select mark_received('book-2');
reset role;
do $$ begin
  if not exists (select 1 from handoffs where id = 't-1' and received_at is not null) then
    raise exception 'FAIL: Got it should mark the leg received';
  end if;
  raise notice 'ok  Got it marks it received';
end $$;

-- Direct writes to the log are refused.
set role authenticated;
do $$ begin
  insert into handoffs (id, book_id, to_friend) values ('t-2', 'book-2', 'friend-tibby');
  raise exception 'FAIL: direct insert allowed';
exception when insufficient_privilege then raise notice 'ok  direct insert refused';
end $$;
reset role;
select 'ALL HANDOFF TESTS PASSED';
