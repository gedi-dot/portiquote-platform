-- ============================================================================
-- 005_membership_lifecycle.sql
-- N.K. Gedi & Co. — renewal reminders, expiry enforcement support, realtime
-- Run AFTER 001–004 in the Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. Renewal reminder tracking
-- The daily cron (/api/cron/memberships) emails members ~3 days before their
-- period ends, exactly once per period. A fresh payment clears the flag so the
-- next period gets its own reminder.
-- ----------------------------------------------------------------------------
alter table subscriptions
  add column if not exists reminder_sent_at timestamptz;

create index if not exists idx_sub_forwarder_period
  on subscriptions (forwarder_id, current_period_end desc);

create index if not exists idx_sub_period_active
  on subscriptions (current_period_end)
  where status = 'active';

-- ----------------------------------------------------------------------------
-- B. Realtime message delivery
-- On Supabase, adding the table to the realtime publication lets open threads
-- receive new messages instantly (RLS still applies to what each client sees).
-- Guarded so the migration also runs cleanly on plain Postgres (no such
-- publication) and on re-runs (already added).
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when undefined_object then null;   -- not on Supabase (e.g. local Postgres)
  when duplicate_object then null;   -- already added
end $$;

-- ============================================================================
-- End of 005
-- ============================================================================
