-- The sample groups stay current: refresh_sample_dates() moves every sample
-- leg forward by the time since the last anchor, and leaves real books alone.
\set ON_ERROR_STOP 1
create schema if not exists test;
create or replace function test.expect(label text, actual bigint, expected bigint) returns text
language plpgsql as $$
begin
  if actual <> expected then raise exception 'FAIL %: got %, expected %', label, actual, expected; end if;
  return 'ok  ' || label;
end $$;

create temp table before as
  select h.id, h.happened_at, h.received_at, g.is_sample
  from handoffs h join books b on b.id = h.book_id join groups g on g.id = b.group_id;

update sample_clock set anchored_at = now() - interval '3 days';
select refresh_sample_dates();

select test.expect('Every sample leg moved forward three days',
  (select count(*) from before b join handoffs h using (id)
   where b.is_sample and h.happened_at - b.happened_at between interval '3 days' and interval '3 days 1 minute'),
  (select count(*) from before where is_sample));
select test.expect('Copies in the post are still in the post',
  (select count(*) from before b join handoffs h using (id) where b.is_sample and h.received_at is null),
  (select count(*) from before where is_sample and received_at is null));
select test.expect('Real books did not move',
  (select count(*) from before b join handoffs h using (id) where not b.is_sample and h.happened_at <> b.happened_at), 0);
select test.expect('The clock is re-anchored',
  (select count(*) from sample_clock where anchored_at > now() - interval '1 minute'), 1);

select 'ALL SAMPLE DATE TESTS PASSED';
