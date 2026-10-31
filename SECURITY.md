# Security

Please report a vulnerability privately through
[GitHub's private vulnerability reporting](https://github.com/itang1/book-club/security/advisories/new)
rather than in a public issue. You'll get a reply within a week.

## How access is enforced

Every rule about who can see or change what is enforced in Postgres
(`supabase/schema.sql`) with row-level security and `security definer`
functions, and checked by `supabase/tests/` as real users on every deploy.
The public anon key in the web app can read and write nothing on its own.

The only real secrets (`SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN`, SMTP and
Gemini keys, `BACKUP_PASSPHRASE`) live in GitHub Actions secrets and Supabase
function secrets, never in the client.
