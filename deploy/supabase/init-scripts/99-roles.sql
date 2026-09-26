-- Adapted from supabase/supabase docker/volumes/db/roles.sql.
--
-- The supabase/postgres image already creates these roles; this only gives them
-- the password from our .env. ALTER, not CREATE, for exactly that reason.
--
-- Unlike upstream's version, each role is checked first. Upstream ALTERs
-- supabase_functions_admin unconditionally, which only works because its compose
-- also mounts webhooks.sql to create that role. We do not run the Function Hooks
-- component — 206 lines of a feature this app never calls — so the role is
-- absent, and an unconditional ALTER aborts the ENTIRE initialisation sequence.
-- When that happened the cluster still came up healthy, but with no _realtime
-- schema, postgres left as superuser, and none of the image's own migrations
-- applied. A skipped role is a far better failure than that.
--
-- Runs once, on an empty data directory. Changing POSTGRES_PASSWORD later does
-- NOT re-run it — see DEPLOY.md on rotating the database password.

\set pgpass `echo "$POSTGRES_PASSWORD"`

-- Carried through a session setting rather than interpolated directly: psql does
-- not substitute :'variables' inside a dollar-quoted block.
select set_config('portiquote.init_pw', :'pgpass', false);

do $$
declare
  pw       text := current_setting('portiquote.init_pw');
  rolename text;
begin
  foreach rolename in array array[
    'authenticator',
    'pgbouncer',
    'supabase_auth_admin',
    'supabase_functions_admin',
    'supabase_storage_admin'
  ]
  loop
    if exists (select 1 from pg_roles where rolname = rolename) then
      execute format('alter role %I with password %L', rolename, pw);
    else
      raise notice 'role % is not present in this image, skipping', rolename;
    end if;
  end loop;
end $$;
