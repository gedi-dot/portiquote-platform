# PortiQuote — Freight Forwarder Marketplace

Post a shipment once and let vetted African forwarders compete for it.
All 54 African countries + lanes to Europe, Asia, the Middle East, and the
Americas.

**Stack:** Next.js 15 · TypeScript · Tailwind · Supabase (Postgres, Auth, RLS)
· M-Pesa (Daraja) · Stripe (card fallback) · Resend (email) · Vercel Cron.

---

## Quick start

### 1. Supabase project
supabase.com → New project → copy Project URL, anon key, service_role key
(**Settings → API**).

### 2. Run the FIVE migrations, in order (SQL Editor)
1. `001_core_schema.sql` — tables, enums, triggers, seeded services
2. `002_payments_and_rls.sql` — payments ledger + all RLS (monetisation rules)
3. `003_reviews_and_fixes.sql` — reviewer names + two RLS fixes
4. `004_messaging_and_content.sql` — profile-name view, message indexes,
   3 seeded articles
5. `005_membership_lifecycle.sql` — renewal-reminder tracking, **realtime
   messages**

### 3. Environment
`cp .env.example .env.local`, then fill in:
- **Supabase** URL + anon + service_role keys
- **M-Pesa (Daraja)** sandbox keys; shortcode `174379`; `MPESA_CALLBACK_URL`
  must be publicly reachable (`ngrok http 3000` locally)
- **Resend** `RESEND_API_KEY`, `EMAIL_FROM` (verify your domain for real
  recipients), `EMAIL_ADMIN` for contact-form mail
- **Stripe** (optional card fallback): `STRIPE_SECRET_KEY`, then create a
  webhook endpoint → `https://your-domain.com/api/stripe/webhook` listening to
  `checkout.session.completed` → paste `STRIPE_WEBHOOK_SECRET`.
  `PREMIUM_PRICE_USD` sets the card price (default 20).
- **Cron**: set `CRON_SECRET` to a long random string (same value in Vercel).

### 4. Run
`npm install` · `npm run dev`

### 5. Make yourself admin (one-time, SQL Editor)
```sql
update profiles set role = 'admin' where email = 'you@your-domain.com';
```
Then `/admin` shows the verification queue.

---

## What runs automatically
- **Lead emails** — new RFQ → every published Premium forwarder on that lane
- **Quote emails** — new quote → shipper; accepted quote → winning forwarder
- **Renewals** — daily cron (`vercel.json`, 06:00 UTC) emails members ~3 days
  before their period ends, then **expires lapsed memberships** and downgrades
  to free (listing stays; leads/quoting pause). Renewing extends from the end
  of the current period — early renewal never loses days.
- **Realtime messaging** — open threads receive new messages instantly
  (Supabase Realtime; enabled by migration 005)

## Route map (38 routes)
Public: `/` directory · `/countries` + `/countries/[code]` · forwarder
profiles · `/guides` (Incoterms, containers, IMDG) · `/news` · `/pricing` ·
`/about` · `/contact` · `/terms` · `/privacy`
Signed in: `/rfq/new` · `/rfq/[id]` (quotes + threads) · `/messages` inbox ·
`/dashboard` · `/forwarders/new` + `/forwarders/[slug]/edit` · `/upgrade`
(M-Pesa **and** card) · `/admin` (admins only)
APIs: mpesa ×3 · notify ×3 · stripe ×2 · cron · admin/verify · contact

## Validated
- 5 migrations clean on Postgres 16 · 15+ behavioral RLS tests pass
- `tsc --noEmit` clean · production `next build` passes all routes
- Stripe webhook signatures verified (HMAC, timing-safe, 5-min tolerance)
- Guard triggers proven: users cannot self-grant premium/verified/admin;
  server webhooks and admins can

## Notes
- `/terms` and `/privacy` are solid templates — **have a lawyer review them**
  before scale.
- Deploying to Vercel picks up `vercel.json` cron automatically; add
  `CRON_SECRET` in project env vars.
- Swap in your real contact details on About/Contact.

## SEO — built in, needs one hour of activation
The platform ships with the full technical SEO layer: per-page titles &
descriptions (dynamic for forwarders, countries, routes, articles),
`sitemap.xml` (auto-includes every published forwarder, country, corridor and
article, refreshed hourly), `robots.txt` (private areas blocked and
noindexed), canonical URLs, Open Graph + Twitter cards with a branded share
image (`public/og.png`), and schema.org structured data (Organization,
LocalBusiness with star ratings on profiles, Article on news).

**The money pages are `/routes/[origin]-to-[destination]`** — programmatic
corridor pages ("shipping Kenya to Netherlands") generated from real lane
data, matching exactly what shippers search.

After deploying:
1. Google Search Console → verify the domain → submit `/sitemap.xml`
   (repeat in Bing Webmaster Tools — 5 minutes)
2. Set `NEXT_PUBLIC_SITE_URL` (canonicals depend on it) and, when the name is
   final, `NEXT_PUBLIC_SITE_NAME` + re-run `python3 scripts/generate-og.py "Name"`
3. Ask every listed forwarder to link to their profile from their own site —
   the directory doubles as a backlink engine
4. Publish 1–2 corridor articles per month through the posts table; the
   guides already target evergreen freight searches
5. Expect compounding, not fireworks: meaningful organic traffic typically
   takes 3–6 months after indexing begins

## Claim-your-listing (migration 006)
Pre-seed the directory with real forwarders from public business info, let
them claim their profiles free. Research companies into
`scripts/unclaimed-template.csv` (name, city, services, lanes — company-level
public info only, no ratings, no personal data), then:
```bash
python3 scripts/seed-unclaimed.py your-research.csv > seed.sql
```
Run `seed.sql` in the Supabase SQL Editor. Listings appear with an
"Unclaimed" badge and a claim button; claims land in `/admin` for hand
verification (approve = ownership transfers + claimant emailed). Removal on
request is one SQL delete.
