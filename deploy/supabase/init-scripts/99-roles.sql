-- Vendored from supabase/supabase docker/volumes/db/roles.sql.
--
-- The supabase/postgres image already creates these roles; this only gives them
-- the password from our .env. ALTER, not CREATE, for exactly that reason.
--
-- Runs once, on an empty data directory. Changing POSTGRES_PASSWORD later does
-- NOT re-run it — see deploy/README notes on rotating the database password.

\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator            WITH PASSWORD :'pgpass';
ALTER USER pgbouncer                WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin      WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin   WITH PASSWORD :'pgpass';
