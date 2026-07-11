-- =============================================================================
-- N.K. Gedi & Co. — Freight RFQ Marketplace
-- Supabase / PostgreSQL — Migration 002: Payments (M-Pesa + card) & Security (RLS)
-- =============================================================================
-- Run AFTER 001_core_schema.sql, in the Supabase SQL Editor.
--
-- PART A — Payments
--   * M-Pesa is the primary rail (Safaricom Daraja STK Push).
--   * Cards (Stripe / aggregator) are a fallback for overseas shippers.
--   * `payments` is a provider-agnostic ledger; the M-Pesa callback and the
--     Stripe webhook both write to it. Membership state lives in `subscriptions`.
--
-- PART B — Row Level Security
--   Locks down who can read/write every table. Key rules encoded:
--     * A forwarder can only edit their OWN listing.
--     * A forwarder cannot self-grant Premium or "verified" status.
--     * A user cannot promote themselves to admin.
--     * Only PREMIUM forwarders can submit quotes (the monetisation rule).
--     * Shippers see only their own RFQs/quotes; forwarders see open RFQs.
--     * Payments/subscriptions are written server-side (service-role key
--       bypasses RLS) — normal users can only READ their own.
-- =============================================================================


-- #############################################################################
-- PART A — PAYMENTS
-- #############################################################################

do $$ begin
  create type payment_provider as enum ('mpesa', 'stripe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'success', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

-- Which rail funds a given membership (default M-Pesa for this market)
alter table subscriptions
  add column if not exists provider payment_provider not null default 'mpesa';

-- Provider-agnostic transaction ledger --------------------------------------
create table if not exists payments (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references profiles(id) on delete cascade,
  forwarder_id          uuid references forwarder_companies(id) on delete set null,
  subscription_id       uuid references subscriptions(id) on delete set null,
  provider              payment_provider not null,
  purpose               text not null default 'membership',   -- membership | rfq_fee | other
  amount                numeric not null,
  currency              text not null default 'KES',
  status                payment_status not null default 'pending',

  -- ---- M-Pesa (Daraja STK Push) ----
  phone                 text,          -- payer MSISDN, format 2547XXXXXXXX
  account_reference     text,          -- appears on the customer's statement
  merchant_request_id   text,          -- returned when STK push is initiated
  checkout_request_id   text,          -- returned when STK push is initiated
  mpesa_receipt         text,          -- e.g. SFE1A2B3C4, present on success

  -- ---- Card / Stripe ----
  stripe_payment_intent text,

  -- ---- Shared ----
  provider_reference    text,          -- generic external id
  failure_reason        text,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_pay_profile  on payments (profile_id);
create index if not exists idx_pay_status    on payments (status);
create index if not exists idx_pay_checkout  on payments (checkout_request_id);
create unique index if not exists uq_pay_receipt
  on payments (mpesa_receipt) where mpesa_receipt is not null;

drop trigger if exists trg_payments_updated on payments;
create trigger trg_payments_updated before update on payments
for each row execute function set_updated_at();


-- #############################################################################
-- PART B — ROW LEVEL SECURITY
-- #############################################################################

-- ---- Helper functions (SECURITY DEFINER: run as owner, avoid RLS recursion) -
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function owns_forwarder(fwd uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from forwarder_companies
                 where id = fwd and owner_id = auth.uid());
$$;

create or replace function is_premium_forwarder(fwd uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from forwarder_companies
                 where id = fwd and membership_tier = 'premium');
$$;


-- ---- Column guards: stop users self-granting privileges --------------------
-- No one but an admin (or the server, where auth.uid() is null) may set
-- role='admin', membership_tier='premium', or is_verified=true.

create or replace function guard_profile_role() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin'
     and auth.uid() is not null
     and not is_admin() then
    new.role := coalesce(old.role, 'shipper');   -- silently deny escalation
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_role_guard on profiles;
create trigger trg_profiles_role_guard
before insert or update on profiles
for each row execute function guard_profile_role();


create or replace function guard_forwarder_privileged() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin() then
    if tg_op = 'INSERT' then
      new.membership_tier := 'free';
      new.is_verified     := false;
    else
      new.membership_tier := old.membership_tier;
      new.is_verified     := old.is_verified;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_forwarder_priv_guard on forwarder_companies;
create trigger trg_forwarder_priv_guard
before insert or update on forwarder_companies
for each row execute function guard_forwarder_privileged();


-- ---- Grant baseline privileges, then let RLS do the row-level gating -------
-- (Supabase pattern: grant broadly to anon/authenticated; RLS restricts rows.)
grant usage on schema public to anon, authenticated;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;


-- ---- Enable RLS on every table ---------------------------------------------
alter table profiles            enable row level security;
alter table forwarder_companies enable row level security;
alter table services            enable row level security;
alter table forwarder_services  enable row level security;
alter table forwarder_lanes     enable row level security;
alter table rfqs                enable row level security;
alter table quotes              enable row level security;
alter table reviews             enable row level security;
alter table messages            enable row level security;
alter table subscriptions       enable row level security;
alter table payments            enable row level security;
alter table posts               enable row level security;


-- ===================== PROFILES =============================================
-- Users read/edit only their own profile (role escalation blocked by guard).
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (auth.uid() = id or is_admin());

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());


-- ===================== FORWARDER_COMPANIES =================================
-- Public sees PUBLISHED listings; owner sees own drafts; owner/admin edit.
drop policy if exists fwd_select on forwarder_companies;
create policy fwd_select on forwarder_companies for select
  using (is_published or owner_id = auth.uid() or is_admin());

drop policy if exists fwd_insert on forwarder_companies;
create policy fwd_insert on forwarder_companies for insert
  with check (owner_id = auth.uid());

drop policy if exists fwd_update on forwarder_companies;
create policy fwd_update on forwarder_companies for update
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

drop policy if exists fwd_delete on forwarder_companies;
create policy fwd_delete on forwarder_companies for delete
  using (owner_id = auth.uid() or is_admin());


-- ===================== SERVICES (lookup) ===================================
-- Anyone can read the service list; only admins change it.
drop policy if exists services_select on services;
create policy services_select on services for select using (true);

drop policy if exists services_write on services;
create policy services_write on services for all
  using (is_admin()) with check (is_admin());


-- ===================== FORWARDER_SERVICES / _LANES =========================
drop policy if exists fwd_services_select on forwarder_services;
create policy fwd_services_select on forwarder_services for select
  using (owns_forwarder(forwarder_id) or is_admin()
         or exists (select 1 from forwarder_companies fc
                    where fc.id = forwarder_id and fc.is_published));

drop policy if exists fwd_services_write on forwarder_services;
create policy fwd_services_write on forwarder_services for all
  using (owns_forwarder(forwarder_id) or is_admin())
  with check (owns_forwarder(forwarder_id) or is_admin());

drop policy if exists fwd_lanes_select on forwarder_lanes;
create policy fwd_lanes_select on forwarder_lanes for select
  using (owns_forwarder(forwarder_id) or is_admin()
         or exists (select 1 from forwarder_companies fc
                    where fc.id = forwarder_id and fc.is_published));

drop policy if exists fwd_lanes_write on forwarder_lanes;
create policy fwd_lanes_write on forwarder_lanes for all
  using (owns_forwarder(forwarder_id) or is_admin())
  with check (owns_forwarder(forwarder_id) or is_admin());


-- ===================== RFQs ================================================
-- Shipper manages own RFQs; any signed-in user can browse OPEN ones.
drop policy if exists rfqs_select on rfqs;
create policy rfqs_select on rfqs for select
  using (shipper_id = auth.uid()
         or (status = 'open' and auth.uid() is not null)
         or is_admin());

drop policy if exists rfqs_insert on rfqs;
create policy rfqs_insert on rfqs for insert
  with check (shipper_id = auth.uid());

drop policy if exists rfqs_update on rfqs;
create policy rfqs_update on rfqs for update
  using (shipper_id = auth.uid() or is_admin())
  with check (shipper_id = auth.uid() or is_admin());

drop policy if exists rfqs_delete on rfqs;
create policy rfqs_delete on rfqs for delete
  using (shipper_id = auth.uid() or is_admin());


-- ===================== QUOTES ==============================================
-- Visible to the quoting forwarder and the RFQ's shipper.
-- INSERT restricted to PREMIUM forwarders (core monetisation rule).
drop policy if exists quotes_select on quotes;
create policy quotes_select on quotes for select
  using (owns_forwarder(forwarder_id)
         or exists (select 1 from rfqs r where r.id = rfq_id and r.shipper_id = auth.uid())
         or is_admin());

drop policy if exists quotes_insert on quotes;
create policy quotes_insert on quotes for insert
  with check (owns_forwarder(forwarder_id) and is_premium_forwarder(forwarder_id));

drop policy if exists quotes_update on quotes;
create policy quotes_update on quotes for update
  using (owns_forwarder(forwarder_id)
         or exists (select 1 from rfqs r where r.id = rfq_id and r.shipper_id = auth.uid())
         or is_admin())
  with check (owns_forwarder(forwarder_id)
         or exists (select 1 from rfqs r where r.id = rfq_id and r.shipper_id = auth.uid())
         or is_admin());


-- ===================== REVIEWS =============================================
-- Public to read; you may review a forwarder you don't own, once.
drop policy if exists reviews_select on reviews;
create policy reviews_select on reviews for select using (true);

drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert
  with check (reviewer_id = auth.uid() and not owns_forwarder(forwarder_id));

drop policy if exists reviews_update on reviews;
create policy reviews_update on reviews for update
  using (reviewer_id = auth.uid() or is_admin())
  with check (reviewer_id = auth.uid() or is_admin());

drop policy if exists reviews_delete on reviews;
create policy reviews_delete on reviews for delete
  using (reviewer_id = auth.uid() or is_admin());


-- ===================== MESSAGES ============================================
-- Only sender/recipient (or admin) can see a message; recipient marks read.
drop policy if exists messages_select on messages;
create policy messages_select on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid() or is_admin());

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert
  with check (sender_id = auth.uid());

drop policy if exists messages_update on messages;
create policy messages_update on messages for update
  using (recipient_id = auth.uid() or is_admin())
  with check (recipient_id = auth.uid() or is_admin());

drop policy if exists messages_delete on messages;
create policy messages_delete on messages for delete
  using (sender_id = auth.uid() or is_admin());


-- ===================== SUBSCRIPTIONS =======================================
-- Read your own; writes happen server-side (service-role key bypasses RLS).
drop policy if exists subs_select on subscriptions;
create policy subs_select on subscriptions for select
  using (profile_id = auth.uid() or is_admin());

drop policy if exists subs_write on subscriptions;
create policy subs_write on subscriptions for all
  using (is_admin()) with check (is_admin());


-- ===================== PAYMENTS ============================================
-- Read your own; the M-Pesa callback / Stripe webhook write via service role.
drop policy if exists pay_select on payments;
create policy pay_select on payments for select
  using (profile_id = auth.uid() or is_admin());

drop policy if exists pay_write on payments;
create policy pay_write on payments for all
  using (is_admin()) with check (is_admin());


-- ===================== POSTS (news / guides) ===============================
-- Public reads published posts; admins manage everything.
drop policy if exists posts_select on posts;
create policy posts_select on posts for select
  using (is_published or is_admin());

drop policy if exists posts_write on posts;
create policy posts_write on posts for all
  using (is_admin()) with check (is_admin());


-- =============================================================================
-- End of Migration 002
-- =============================================================================
