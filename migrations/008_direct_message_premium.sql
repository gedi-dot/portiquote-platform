-- 008_direct_message_premium.sql
-- Direct (RFQ-less) messages are a Premium-forwarder feature, in both
-- directions. RFQ-scoped messages (a shipper and forwarder discussing a
-- specific quote) remain open to everyone — shippers are not Premium.
--
-- Enforced in the database so the rule holds even if the UI is bypassed.

-- Helper: does the current user own a Premium forwarder company?
create or replace function user_runs_premium_forwarder() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from forwarder_companies
    where owner_id = auth.uid()
      and membership_tier = 'premium'
  );
$$;

grant execute on function user_runs_premium_forwarder() to authenticated;

-- Tighten the insert policy:
--   * RFQ-scoped messages (rfq_id is not null): any sender who is themselves
--     (unchanged behaviour — shipper/forwarder quote discussion).
--   * Direct messages (rfq_id is null): sender must run a Premium forwarder.
drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert
  with check (
    sender_id = auth.uid()
    and (
      rfq_id is not null
      or user_runs_premium_forwarder()
    )
  );
