-- ============================================================================
-- 006_claim_listings.sql — Unclaimed listings + claim workflow
-- Run AFTER 001–005. Safe: existing listings stay exactly as they are.
-- ============================================================================

-- A. Listings can now exist before their owner does.
alter table forwarder_companies
  add column if not exists is_claimed boolean not null default true;
alter table forwarder_companies
  alter column owner_id drop not null;

create index if not exists idx_fwd_claimed on forwarder_companies (is_claimed);

comment on column forwarder_companies.is_claimed is
  'false = pre-seeded from public business information; true = owner-managed';

-- B. Claims table
do $$ begin
  create type claim_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists listing_claims (
  id             uuid primary key default uuid_generate_v4(),
  forwarder_id   uuid not null references forwarder_companies(id) on delete cascade,
  claimant_id    uuid not null references profiles(id) on delete cascade,
  role_at_company text,
  business_email text,
  phone          text,
  evidence       text,
  status         claim_status not null default 'pending',
  decided_by     uuid references profiles(id),
  decided_at     timestamptz,
  created_at     timestamptz not null default now()
);

-- one live claim per person per listing
create unique index if not exists uq_claim_pending
  on listing_claims (forwarder_id, claimant_id) where status = 'pending';
create index if not exists idx_claims_status on listing_claims (status, created_at);

-- C. RLS
alter table listing_claims enable row level security;

drop policy if exists claims_select on listing_claims;
create policy claims_select on listing_claims for select
  using (claimant_id = auth.uid() or is_admin());

drop policy if exists claims_insert on listing_claims;
create policy claims_insert on listing_claims for insert
  with check (
    claimant_id = auth.uid()
    and exists (select 1 from forwarder_companies fc
                where fc.id = forwarder_id
                  and fc.is_claimed = false
                  and fc.is_published = true)
  );

drop policy if exists claims_update on listing_claims;
create policy claims_update on listing_claims for update
  using (is_admin()) with check (is_admin());

-- D. Grants (002's blanket grant predates this table)
grant select, insert on listing_claims to authenticated;
grant all on listing_claims to service_role;
