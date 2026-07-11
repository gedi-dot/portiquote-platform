-- =============================================================================
-- N.K. Gedi & Co. — Freight RFQ Marketplace
-- Supabase / PostgreSQL — Migration 001: Core data model
-- =============================================================================
-- Positioning: African-based freight forwarders, global reach.
-- Feature scope modelled on a FreightNet-style platform:
--   * Searchable forwarder directory (by country, service, trade lane)
--   * "Post once, forwarders compete" RFQ -> quotes flow
--   * Two-tier membership (Free listing / Premium receives leads)
--   * Reviews, in-platform messaging, cargo news & guides
-- =============================================================================
-- Run this in the Supabase SQL Editor (Database -> SQL Editor -> New query).
-- It is idempotent-friendly for enums/extensions but assumes a fresh schema.
-- =============================================================================


-- ---- Extensions -------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ---- Enumerated types -------------------------------------------------------
do $$ begin
  create type user_role           as enum ('shipper', 'forwarder', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_tier     as enum ('free', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rfq_status          as enum ('open', 'closed', 'awarded', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type quote_status        as enum ('submitted', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type freight_mode        as enum ('ocean_fcl', 'ocean_lcl', 'air', 'road', 'rail', 'roro', 'multimodal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum
    ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_type           as enum ('news', 'press_release', 'guide');
exception when duplicate_object then null; end $$;


-- =============================================================================
-- PROFILES  (extends Supabase auth.users)
-- One row per registered user. Role decides which side of the marketplace.
-- =============================================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'shipper',
  full_name   text,
  email       text,
  phone       text,
  country     text,               -- ISO country name/code
  city        text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- =============================================================================
-- FORWARDER COMPANIES  (the directory listings)
-- =============================================================================
create table if not exists forwarder_companies (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  company_name    text not null,
  slug            text unique not null,          -- URL: /forwarders/kesland-freight
  tagline         text,
  description      text,
  logo_url        text,
  website         text,
  email           text,
  phone           text,
  whatsapp        text,
  hq_country      text not null,                 -- primary directory filter
  hq_city         text,
  year_established int,
  employee_count  text,                          -- range e.g. '1-10', '11-50'
  membership_tier membership_tier not null default 'free',
  is_verified     boolean not null default false,
  is_published    boolean not null default false,-- hidden until they complete profile
  rating_avg      numeric(2,1) not null default 0,  -- denormalised for sorting
  rating_count    int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_fwd_country     on forwarder_companies (hq_country);
create index if not exists idx_fwd_tier         on forwarder_companies (membership_tier);
create index if not exists idx_fwd_published    on forwarder_companies (is_published);


-- =============================================================================
-- SERVICES  (lookup) + FORWARDER_SERVICES (many-to-many)
-- Lets the directory be filtered by service, like FreightNet's "by industry".
-- =============================================================================
create table if not exists services (
  id       serial primary key,
  slug     text unique not null,
  name     text not null,
  category text                                   -- transport | value_added | compliance
);

create table if not exists forwarder_services (
  forwarder_id uuid not null references forwarder_companies(id) on delete cascade,
  service_id   int  not null references services(id)           on delete cascade,
  primary key (forwarder_id, service_id)
);


-- =============================================================================
-- FORWARDER_LANES  (trade-lane coverage: which origin->destination pairs)
-- =============================================================================
create table if not exists forwarder_lanes (
  id                   uuid primary key default uuid_generate_v4(),
  forwarder_id         uuid not null references forwarder_companies(id) on delete cascade,
  origin_country       text not null,
  destination_country  text not null,
  modes                freight_mode[] not null default '{}'
);

create index if not exists idx_lane_origin on forwarder_lanes (origin_country);
create index if not exists idx_lane_dest    on forwarder_lanes (destination_country);


-- =============================================================================
-- RFQs  (a shipper posts shipment requirements once)
-- =============================================================================
create table if not exists rfqs (
  id                  uuid primary key default uuid_generate_v4(),
  shipper_id          uuid not null references profiles(id) on delete cascade,
  reference           text unique not null,       -- human ref e.g. RFQ-2026-0001
  title               text not null,
  mode                freight_mode not null,
  origin_country      text not null,
  origin_city         text,
  origin_port         text,
  destination_country text not null,
  destination_city    text,
  destination_port    text,
  incoterm            text,                        -- EXW, FOB, CIF, DAP, DDP ...
  cargo_description   text,
  hs_code             text,
  container_type      text,                        -- 20GP, 40HC, 40RF ...
  container_count     int,
  weight_kg           numeric,
  volume_cbm          numeric,
  is_hazardous        boolean not null default false,
  imdg_class          text,
  ready_date          date,
  target_delivery_date date,
  status              rfq_status not null default 'open',
  quote_deadline      timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_rfq_status  on rfqs (status);
create index if not exists idx_rfq_origin   on rfqs (origin_country);
create index if not exists idx_rfq_dest     on rfqs (destination_country);
create index if not exists idx_rfq_mode     on rfqs (mode);
create index if not exists idx_rfq_created  on rfqs (created_at desc);


-- =============================================================================
-- QUOTES  (forwarders compete on an RFQ)
-- =============================================================================
create table if not exists quotes (
  id                uuid primary key default uuid_generate_v4(),
  rfq_id            uuid not null references rfqs(id)               on delete cascade,
  forwarder_id      uuid not null references forwarder_companies(id) on delete cascade,
  amount            numeric not null,
  currency          text not null default 'USD',
  transit_time_days int,
  valid_until       date,
  incoterm          text,
  notes             text,
  status            quote_status not null default 'submitted',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (rfq_id, forwarder_id)                    -- one live quote per forwarder per RFQ
);

create index if not exists idx_quote_rfq    on quotes (rfq_id);
create index if not exists idx_quote_fwd     on quotes (forwarder_id);
create index if not exists idx_quote_status  on quotes (status);


-- =============================================================================
-- REVIEWS  (shippers rate forwarders 1-5)
-- =============================================================================
create table if not exists reviews (
  id           uuid primary key default uuid_generate_v4(),
  forwarder_id uuid not null references forwarder_companies(id) on delete cascade,
  reviewer_id  uuid not null references profiles(id)            on delete cascade,
  rating       int  not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now(),
  unique (forwarder_id, reviewer_id)               -- one review per person per forwarder
);

create index if not exists idx_review_fwd on reviews (forwarder_id);


-- =============================================================================
-- MESSAGES  (in-platform thread between shipper & forwarder, tied to an RFQ)
-- =============================================================================
create table if not exists messages (
  id           uuid primary key default uuid_generate_v4(),
  rfq_id       uuid references rfqs(id) on delete cascade,
  sender_id    uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body         text not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_msg_recipient on messages (recipient_id);
create index if not exists idx_msg_rfq         on messages (rfq_id);


-- =============================================================================
-- SUBSCRIPTIONS  (Stripe — tracks Premium membership state)
-- Written by the Stripe webhook using the service-role key (bypasses RLS).
-- =============================================================================
create table if not exists subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  profile_id             uuid not null references profiles(id) on delete cascade,
  forwarder_id           uuid references forwarder_companies(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  tier                   membership_tier not null default 'free',
  status                 subscription_status not null default 'active',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_sub_profile on subscriptions (profile_id);


-- =============================================================================
-- POSTS  (cargo news, press releases, freight guides — content marketing)
-- =============================================================================
create table if not exists posts (
  id           uuid primary key default uuid_generate_v4(),
  author_id    uuid references profiles(id) on delete set null,
  type         post_type not null default 'news',
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  body         text,
  cover_url    text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_post_type      on posts (type);
create index if not exists idx_post_published  on posts (is_published, published_at desc);


-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','forwarder_companies','rfqs','quotes','subscriptions','posts'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;


-- =============================================================================
-- Keep forwarder rating_avg / rating_count in sync when reviews change
-- =============================================================================
create or replace function refresh_forwarder_rating()
returns trigger language plpgsql as $$
declare fwd uuid;
begin
  fwd := coalesce(new.forwarder_id, old.forwarder_id);
  update forwarder_companies fc
     set rating_avg   = coalesce((select round(avg(rating)::numeric, 1)
                                    from reviews where forwarder_id = fwd), 0),
         rating_count = (select count(*) from reviews where forwarder_id = fwd)
   where fc.id = fwd;
  return null;
end;
$$;

drop trigger if exists trg_reviews_rating on reviews;
create trigger trg_reviews_rating
after insert or update or delete on reviews
for each row execute function refresh_forwarder_rating();


-- =============================================================================
-- Auto-create a profile row when a new auth user signs up
-- =============================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();


-- =============================================================================
-- Seed: standard freight services (directory filters)
-- =============================================================================
insert into services (slug, name, category) values
  ('ocean-fcl',        'Ocean Freight (FCL)',          'transport'),
  ('ocean-lcl',        'Ocean Freight (LCL)',          'transport'),
  ('air-freight',      'Air Freight',                  'transport'),
  ('road-freight',     'Road Freight / Trucking',      'transport'),
  ('rail-freight',     'Rail Freight',                 'transport'),
  ('roro',             'RoRo (Roll-on/Roll-off)',      'transport'),
  ('project-cargo',    'Project & Heavy-Lift Cargo',   'transport'),
  ('break-bulk',       'Break Bulk',                   'transport'),
  ('reefer',           'Refrigerated / Reefer',        'transport'),
  ('dangerous-goods',  'Dangerous Goods (IMDG)',       'transport'),
  ('customs-brokerage','Customs Brokerage',            'compliance'),
  ('documentation',    'Import/Export Documentation',  'compliance'),
  ('cargo-insurance',  'Cargo Insurance',              'value_added'),
  ('warehousing',      'Warehousing & Distribution',   'value_added'),
  ('door-to-door',     'Door-to-Door Delivery',        'value_added')
on conflict (slug) do nothing;


-- =============================================================================
-- End of Migration 001
-- =============================================================================
