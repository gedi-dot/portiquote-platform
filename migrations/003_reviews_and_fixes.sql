-- =============================================================================
-- N.K. Gedi & Co. — Freight RFQ Marketplace
-- Supabase / PostgreSQL — Migration 003: Review names & two RLS fixes
-- =============================================================================
-- Run AFTER 001 and 002, in the Supabase SQL Editor.
--
-- 1. reviews.reviewer_name — profiles are private under RLS, so the reviewer's
--    display name is denormalised onto the review at insert time.
-- 2. FIX: refresh_forwarder_rating() ran with the caller's rights, so when a
--    shipper posted a review, RLS on forwarder_companies silently blocked the
--    rating update (0 rows). It must run as SECURITY DEFINER.
-- 3. FIX: a forwarder could no longer see an RFQ they had quoted once it left
--    'open' status. rfqs_select now also allows "I have a quote on this RFQ",
--    via a SECURITY DEFINER helper (avoids policy recursion rfqs<->quotes).
-- =============================================================================


-- ---- 1. Reviewer display name ----------------------------------------------
alter table reviews add column if not exists reviewer_name text;


-- ---- 2. Rating trigger must bypass RLS --------------------------------------
create or replace function refresh_forwarder_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
-- (The existing trg_reviews_rating trigger keeps pointing at this function.)


-- ---- 3. Forwarders keep seeing RFQs they quoted ------------------------------
create or replace function has_quoted_rfq(r uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from quotes q
    join forwarder_companies fc on fc.id = q.forwarder_id
    where q.rfq_id = r
      and fc.owner_id = auth.uid()
  );
$$;

drop policy if exists rfqs_select on rfqs;
create policy rfqs_select on rfqs for select
  using (
    shipper_id = auth.uid()
    or (status = 'open' and auth.uid() is not null)
    or has_quoted_rfq(id)
    or is_admin()
  );


-- =============================================================================
-- End of Migration 003
-- =============================================================================
