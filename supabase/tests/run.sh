#!/bin/bash
# Database tests: who can see and do what, checked as real signed-in users.
#
# Needs a local Postgres you can create databases in (e.g. `brew install
# postgresql@16`, then initdb + pg_ctl start). Point it there with the usual
# PG* variables; defaults to 127.0.0.1:54329 as postgres.
#
#   supabase/tests/run.sh
#
# Each run builds a throwaway database: a stand-in for the parts of
# Supabase the schema uses (supabase-stub.sql), schema.sql twice (it must
# re-run cleanly), the demo seed, then each *.test.sql in order.
set -euo pipefail
cd "$(dirname "$0")/../.."
export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}" PGUSER="${PGUSER:-postgres}"
PSQL="psql -q -v ON_ERROR_STOP=1"

$PSQL -c "drop database if exists club_test" -c "create database club_test" postgres 2>/dev/null
$PSQL -f supabase/tests/supabase-stub.sql club_test
for i in 1 2; do
  $PSQL --single-transaction -f supabase/schema.sql club_test 2> >(grep -v NOTICE >&2)
done
$PSQL -f supabase/seed.example.sql club_test

for test in supabase/tests/*.test.sql; do
  echo "--- $test"
  $PSQL -At -f "$test" club_test 2>&1 | grep -E "ok |FAIL|PASSED|ERROR" \
    | sed -E 's/^psql:[^:]+:[0-9]+: (NOTICE|ERROR): +//'
done
