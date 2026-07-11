-- ============================================================================
-- 004_messaging_and_content.sql
-- N.K. Gedi & Co. — safe profile name exposure, message indexes, seed content
-- Run AFTER 001, 002 and 003 in the Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. public_profiles — a deliberately narrow view of profiles
--
-- RLS on profiles is self-only (correct: it holds emails and phone numbers).
-- Messaging needs *names* of counterparts, nothing more. This view exposes
-- exactly {id, full_name, country, city} and runs with the owner's rights
-- (security_invoker = false), so it works for any signed-in user while the
-- underlying table stays locked down. Anonymous visitors get nothing.
-- ----------------------------------------------------------------------------
create or replace view public_profiles
  with (security_invoker = false) as
  select id, full_name, country, city
  from profiles;

revoke all on public_profiles from public;
revoke all on public_profiles from anon;
grant select on public_profiles to authenticated;
grant select on public_profiles to service_role;

comment on view public_profiles is
  'Name-only projection of profiles for messaging UIs. Never add email/phone.';

-- ----------------------------------------------------------------------------
-- B. Message indexes — inbox and unread-badge queries
-- ----------------------------------------------------------------------------
create index if not exists idx_messages_recipient_unread
  on messages (recipient_id) where is_read = false;
create index if not exists idx_messages_rfq_created
  on messages (rfq_id, created_at);
create index if not exists idx_messages_sender
  on messages (sender_id, created_at);

-- ----------------------------------------------------------------------------
-- C. Seed content — three launch pieces so /news is alive on day one
--    (idempotent: re-running skips existing slugs)
-- ----------------------------------------------------------------------------
insert into posts (type, title, slug, excerpt, body, is_published, published_at)
values
(
  'press_release',
  'N.K. Gedi & Co. opens its freight marketplace for Africa''s trade lanes',
  'nkgedi-marketplace-launch',
  'A directory of vetted African forwarders and a post-once RFQ system — built for the corridors that move the continent''s cargo.',
  E'Nairobi — N.K. Gedi & Co. today opened its freight forwarder marketplace, connecting shippers with vetted forwarders across Africa''s major gateways and the lanes that link them to Europe, Asia, the Gulf and the Americas.\n\nShippers post a shipment once — lane, mode, cargo, Incoterm — and forwarders operating that corridor respond with priced quotes. Instead of emailing ten companies and waiting, the competition comes to the cargo.\n\nFor forwarders, a directory listing is free. Premium members receive matching RFQ leads the moment they are posted and can submit quotes directly, paying month to month via M-Pesa with no long contracts.\n\nThe platform launches with coverage across East, West and Southern African origins — Mombasa, Dar es Salaam, Lagos, Tema, Durban, Djibouti and more — spanning ocean FCL and LCL, air, road, rail, RoRo, project cargo and customs brokerage.\n\nThe name honours Gede, the 12th-century Swahili trading city on Kenya''s coast: proof that this region has run sophisticated international commerce for eight hundred years. The tools are new; the trade is not.',
  true,
  now() - interval '7 days'
),
(
  'news',
  'Premium membership is live — pay with M-Pesa',
  'premium-mpesa-live',
  'Receive matching RFQ leads and quote directly, for KES 2,500 a month. No contracts, no card required.',
  E'Forwarders can now upgrade to Premium membership directly from their dashboard, paying with M-Pesa in under a minute.\n\nPremium changes what the platform does for you. Free listings appear in the directory and can be found by shippers searching a lane. Premium members are notified the moment a shipper posts a request on one of their trade lanes — and only Premium members can submit quotes.\n\nPricing is KES 2,500 per month, charged as a simple Lipa na M-Pesa payment. Enter your Safaricom number, confirm the STK prompt with your PIN, and your membership activates for 30 days on the spot. There is no card requirement and no annual lock-in; membership renews only when you choose to pay again.\n\nEarly-quote advantage is real: across freight marketplaces, the first two or three quotes on a request win a disproportionate share of jobs. Lead notifications exist to put Premium members in that window.\n\nCard payment for members outside M-Pesa markets is on the roadmap.',
  true,
  now() - interval '2 days'
),
(
  'news',
  'How shippers get five competing quotes from one post',
  'five-quotes-one-post',
  'Write the RFQ once, write it well, and let the corridor''s forwarders do the calling.',
  E'The old way of pricing a shipment is serial: email a forwarder, wait, chase, repeat. The marketplace inverts it — describe the shipment once and every Premium forwarder on that corridor is invited to compete.\n\nA strong request answers what a forwarder must know before quoting. Lane and mode: where the cargo starts, where it lands, and whether it moves ocean FCL or LCL, air, road or RoRo. Cargo basics: what it is, gross weight, volume or container count, and the HS code if you have it. Commercial terms: the Incoterm tells forwarders which legs and charges belong in their price — FOB and CIF quotes are not comparable numbers.\n\nDates matter more than shippers expect. A ready date lets forwarders quote actual sailings rather than generic transit times, and a quote deadline creates urgency.\n\nIf the cargo is hazardous, declare the IMDG class up front. Forwarders who cannot carry it will not waste your time, and those who can will price it correctly the first time.\n\nThen compare like for like: total price, transit days, validity. Message a forwarder from the quote itself if anything is unclear, and accept when you are ready — the platform notifies the winner and closes the request to further quotes.',
  true,
  now()
)
on conflict (slug) do nothing;

-- ============================================================================
-- End of 004
-- ============================================================================
