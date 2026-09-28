# PortiQuote — notes for Claude

Freight forwarder marketplace. Next.js 15 (App Router) · TypeScript · Tailwind ·
Supabase (Postgres, Auth, RLS, Realtime). Read [README.md](README.md) for the app
and local setup, and [DEPLOY.md](DEPLOY.md) before anything touching hosting,
releases, the database or `deploy/`. DEPLOY.md is the source of truth for
hosting.

## Where it runs

Self-hosted on our server (srv1), not Vercel. Each environment runs the same
Docker image — the Next.js app plus self-hosted Supabase — behind DirectAdmin's
nginx:

- production: https://portiquote.com
- staging: https://staging.portiquote.com (open, noindex, holds no real data)

Vercel is being retired. `vercel.json` and a few comments and docs still mention
it; don't add anything new that depends on Vercel.

## How changes ship

1. Branch, open a PR into `main`. Never push to `main` directly.
2. Merging to `main` builds the image and **deploys it to staging automatically**
   (`.github/workflows/release.yml`).
3. When staging looks right, tag that same commit to release it to production:
   `git tag vX.Y.Z <commit> && git push origin vX.Y.Z` — exactly
   `vMAJOR.MINOR.PATCH`, no suffixes. The tag re-tags the image staging ran; it
   does not rebuild.

Deploys show under the repo's Actions tab and Environments. Rolling back is
deploying an earlier tag (DEPLOY.md, "Deploying").

## Rules

- **Migrations** are new numbered files in `migrations/`
  (`009_short_name.sql`, …); the deploy applies outstanding ones in order, each in
  one transaction. They must be **expand-only**: add tables and columns, never
  drop or rename in the same release as the code that stops using them. A failed
  deploy rolls the app back but not the database. Never edit a migration that has
  already shipped.
- **Row Level Security is the authorisation model.** New tables need RLS
  policies in the same migration; don't work around RLS with the service-role key
  in code a user can reach.
- **No environment-specific values at build time.** The same image runs in
  staging and production, so configuration is read at runtime — see
  `lib/runtime.ts` (`appOrigin()` and friends). The one exception is the
  canonical site URL in `lib/site.ts`, which is production's everywhere by design.
- **`deploy/` is not shipped by the automatic deploy.** `compose.yaml`,
  `supabase/gateway.conf`, the nginx snippets and the server scripts need a manual
  install on the server; DEPLOY.md says how for each. Whenever a change touches
  `deploy/`, say so and list the server steps — they need someone with sudo on
  srv1.
- **Secrets never go in the repo.** They live in `/opt/portiquote/<env>/.env` on
  the server and in GitHub repository secrets. `.env.example` holds placeholders and sandbox values only.
- Keep local development working: `npm install`, `npm run dev` against a Supabase
  project, as in README.md. Check `npm run build` and `npm run lint` pass before
  opening a PR — there is no test suite.

## Worth knowing

- The browser reaches Supabase same-origin (`/auth/v1`, `/rest/v1`,
  `/realtime/v1` on the site's own domain); the server-side app reaches it
  in-network. `/rest/v1` requires the `apikey` header, which supabase-js sends.
- Staging sends mail as `noreply.staging@portiquote.com` and shows a `STAGING`
  badge (`components/EnvBadge.tsx`).
- Payments: M-Pesa (Daraja), Paystack, Stripe as card fallback — `lib/mpesa.ts`,
  `lib/paystack.ts`, `lib/stripe.ts`. Membership lifecycle is in
  `lib/membership.ts`; its daily job runs from the server's cron
  (`deploy/portiquote-cron`), not from Vercel.
- Legal pages (`app/privacy`, `app/terms`) are legal text: draft changes, but
  get the owner's approval on wording before committing.
