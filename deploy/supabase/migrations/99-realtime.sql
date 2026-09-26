-- Vendored from supabase/supabase docker/volumes/db/realtime.sql.
--
-- Realtime keeps its own tenant and subscription tables in this schema, and
-- connects with `SET search_path TO _realtime`. Without it the realtime service
-- starts and then fails on its first query, which reads as a puzzling crash loop
-- rather than a missing schema.

\set pguser `echo "$POSTGRES_USER"`

create schema if not exists _realtime;
alter schema _realtime owner to :pguser;
