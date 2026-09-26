-- Vendored from supabase/supabase docker/volumes/db/jwt.sql.
--
-- Publishes the token lifetime to SQL, where policies and functions can read it
-- as current_setting('app.settings.jwt_exp'). The signing secret is NOT stored
-- in the database: GoTrue, PostgREST and Realtime each receive it as an
-- environment variable instead.

\set jwt_exp `echo "$JWT_EXP"`

ALTER DATABASE postgres SET "app.settings.jwt_exp" TO :'jwt_exp';
