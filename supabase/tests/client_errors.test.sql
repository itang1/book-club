-- Error reports: anyone can send one, nobody can read them back, and a
-- crash loop can't flood the table.
\set ON_ERROR_STOP 1
create schema if not exists test;
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
grant usage on schema test to anon, authenticated;
grant execute on all functions in schema test to anon, authenticated;

set role anon;
select report_error('TypeError: x is undefined', 'at Home', 'Home', 'https://x/', 'test');
select test.refused('Nobody can read error reports', $$select count(*) from client_errors$$);
select test.refused('Nobody can write to the table directly',
  $$insert into client_errors (message) values ('forged')$$);
select report_error(repeat('x', 2000), null, null, null, null);
select report_error('loop', null, null, null, null);
select report_error('loop', null, null, null, null);
select report_error('loop', null, null, null, null);
select report_error('loop', null, null, null, null);
reset role;
select test.expect('A crash loop is capped at five a minute', (select count(*) from client_errors), 5);
select test.expect('Long messages are trimmed', (select max(length(message)) from client_errors), 500);

select 'ALL ERROR REPORT TESTS PASSED';
