# Self-hosted deployment — portiquote.com

Two independent environments on the Contabo/DirectAdmin server (`srv1`), each
with its own database, its own secrets and its own containers. DirectAdmin's
nginx owns both domains and their Let's Encrypt certificates.

```
                      ┌──────────────── srv1 ─────────────────┐
browser ──https──────>│ DirectAdmin nginx                     │
                      │   portiquote.com                      │
                      │     /auth|rest|realtime/v1 ─> :8400 ──┼─> gateway (nginx)
                      │     /                      ─> :3400 ──┼─> web (Next.js)
                      │   staging.portiquote.com              │
                      │     …                      ─> :8410   │
                      │     /  (basic auth)        ─> :3410   │
                      └───────────────────────────────────────┘

per environment:  gateway ─> auth (GoTrue) ─┐
                          ─> rest (PostgREST) ├─> db (Postgres)
                          ─> realtime ────────┘
                  web ─────> gateway (in-network, never over the internet)
```

**Why self-hosted Supabase rather than the hosted service.** The app is built on
Supabase's auth and Row Level Security: 39 policies, 42 uses of `auth.uid()`, and
a trigger tying `profiles.id` to `auth.users`. Replacing that with hand-written
authorisation would touch most of the codebase. Running the same components
ourselves keeps every policy working unchanged, and the data stays on a server we
control.

**Why a container rather than DirectAdmin's own hosting.** Next.js is a
long-running Node server, not files to drop in `public_html`, and DirectAdmin has
no process manager for Node here. It matches how the other apps in `/opt` run.

**Why no Kong.** Upstream's compose ships Kong as the API gateway. DirectAdmin's
nginx is already the public front door, so Kong would be a second gateway behind
the first. A 12 MB nginx does the same routing for about 400 MB less across both
environments, which matters on an 11 GB box shared with other customers.

---

## First-time setup

On the server, as an account with sudo.

```bash
git clone --depth 1 https://github.com/gedi-dot/portiquote-platform /tmp/pq
sudo bash /tmp/pq/deploy/setup-server.sh
```

It creates `/opt/portiquote/{production,staging}`, generates every secret
(including the `anon` and `service_role` JWTs, which are signed with each
environment's own `JWT_SECRET`), installs the commands and the cron jobs, and
prints the staging basic-auth password **once**. Write that down.

It is idempotent, never overwrites an existing `.env`, and never touches a
database that already exists.

The clone is only needed for this step. `portiquote-deploy` pulls published
images and never reads a checkout — deliberately, because it runs as root and a
compose file read live from the repository would let anyone with push access
mount the host filesystem into a root-run container.

### Fill in what cannot be generated

```bash
sudo nano /opt/portiquote/staging/.env
sudo nano /opt/portiquote/production/.env
```

`SMTP_PASS` (the DirectAdmin mailbox password), `EMAIL_ADMIN`, and the payment
keys. Everything else is already set.

### If the pull is denied

A package published from a public repository is normally public too, so there is
usually nothing to do here. If the deploy fails at the pull step with `denied`,
the package is private and the server has no credentials:

github.com/gedi-dot/portiquote-platform → **Packages** → portiquote-platform →
*Package settings* → **Change visibility** → Public.

### SSL

DirectAdmin → the domain → **SSL Certificates** → *Free & automatic certificate
from Let's Encrypt* → tick the domain and `www` → **Save**. Then *Domain Setup* →
**Force SSL with https redirect**.

Issue the certificate *before* adding the proxy, while the domain still serves
its own `public_html`.

### nginx

The two environments are configured differently, because only one of them is a
DirectAdmin domain.

**Production** — `portiquote.com` is a DirectAdmin domain, so it uses a custom
config that DirectAdmin inlines into the vhost it generates:

```bash
sudo install -o root -g root -m 644 deploy/nginx/portiquote.com.cust_nginx_https \
  /usr/local/directadmin/data/users/admin/domains/portiquote.com.cust_nginx_https
```

The `.cust_nginx_https` suffix means HTTPS only, which is right because Force SSL
redirects plain HTTP before it would reach a proxy.

**Staging** — `staging.portiquote.com` is deliberately *not* a DirectAdmin domain,
only a DNS record. DirectAdmin therefore generates no vhost for it and has nowhere
to inline a custom config; requests would fall through to whichever server block
is default, which on this box is another customer's site. So staging gets a
standalone server block instead, the same way `tool.perxli.com` already runs here:

```bash
sudo install -o root -g root -m 644 deploy/nginx/portiquote-staging.conf \
  /etc/nginx/sites-available/portiquote-staging
sudo ln -sfn /etc/nginx/sites-available/portiquote-staging \
  /etc/nginx/sites-enabled/portiquote-staging
```

`sites-enabled` because that is what `/etc/nginx/nginx-includes.conf` globs.
`/etc/nginx/conf.d/` is **not** globbed — `tool_perxli.conf` is included there by
name — so a file dropped into `conf.d` is silently ignored. And since
`sites-enabled/*` matches everything, never leave a backup copy in that directory:
a `.bak` would be loaded as live config.

That file needs no certificate of its own: portiquote.com's DirectAdmin
certificate is a wildcard (`*.portiquote.com`), so it already covers staging and
keeps covering it across renewals. DirectAdmin rewrites neither path, so it
survives `rewrite_confs`.

Then:

```bash
cd /usr/local/directadmin/custombuild && sudo ./build rewrite_confs
sudo nginx -t && sudo systemctl reload nginx
```

> nginx on this server must stay DirectAdmin's CustomBuild build. Ubuntu's
> `nginx` package is apt-held because it once overwrote it and took every site on
> the box down. Never `apt install nginx`.

---

## Deploying

Staging follows `main`; production runs a tag.

```bash
# every push to main publishes ghcr.io/…:sha-<commit> and :main
sudo portiquote-deploy staging main

# then, once it looks right, tag the same commit and promote it
git tag v1.0.0 && git push origin v1.0.0
sudo portiquote-deploy production v1.0.0
```

The `v*` tag does **not** rebuild. CI re-tags the digest that was already built
for that commit, so production runs the byte-identical image staging was tested
on. A second build of the same source can still differ — a base image moves, a
transitive dependency resolves differently — and then "it worked on staging"
stops meaning anything.

Each deploy pulls the image, brings the database up, applies any outstanding
migrations, starts everything, then checks three URLs: `/auth/v1/health` (the
Supabase side is up), `/robots.txt` (Node is serving), and `/directory` (rendered
per request from the database, so the app can really reach Postgres). If any
fails, the previous tag is put back. History is in
`/opt/portiquote/<env>/deploy.log`.

Changing a value in `.env` needs only `sudo docker compose up -d` from
`/opt/portiquote/<env>/` — no rebuild. That is the point of reading configuration
at runtime.

### Rollback, and its one limit

A failed health check rolls the **container** back. It does not roll the
**database** back. Migrations are therefore expand-only: add columns and tables,
never drop or rename in the same release as the code that stops using them, so
the previous image can still run against the newer schema. A release that has to
change what a column means takes two deploys, not a rollback.

### Migrations

Applied by the deploy, from the image being deployed — so the schema and the code
that expects it are one artefact and cannot disagree about a version. Each runs
in a single transaction and is recorded in `public.schema_migrations`; a failure
leaves nothing behind and stops the deploy before anything is restarted, so the
running site is untouched.

---

## Backups

`/etc/cron.d/portiquote` dumps production nightly at 02:15 to
`/opt/portiquote/production/backups/`, keeping 14 days. Custom format, mode 600 —
these files hold every account, listing and payment.

```bash
sudo portiquote-backup production        # run one now

cd /opt/portiquote/production            # restore
sudo docker compose exec -T db pg_restore -U postgres -d postgres --clean \
    < backups/portiquote-2026-09-26-0215.dump
```

Nothing copies these off the server. Getting them somewhere else is the obvious
next improvement.

---

## Operating notes

**Ports.** Production 3400/8400, staging 3410/8410, all loopback-only. 3100 and
8100 belong to another DirectAdmin account (`atekercup`) — don't reuse them.

**Memory.** Each environment caps its containers; the two together are about
3.5 GB, against 11 GB with other customers' containers on the box. There is 2 GB
of swap as a cushion. `MEM_*` in each `.env` tunes it.

**If the deploy says the database is missing Supabase's roles.** The image's
`migrate.sh` installs the auth and realtime schemas and the
`anon`/`authenticated`/`service_role` roles, and it only runs on an empty data
directory. If it failed, the cluster still comes up healthy but empty of all
that. Wipe and let it initialise again:

```bash
cd /opt/portiquote/<env> && sudo docker compose down && sudo rm -rf volumes/db/data
sudo portiquote-deploy <env> <tag>
```

`docker compose logs db` says why it failed the first time. Do not set
`POSTGRES_USER` in `compose.yaml` — the image needs its own value
(`supabase_admin`), and overriding it is what causes this.

**Rotating the database password.** `POSTGRES_PASSWORD` is applied by an init
script that only runs on an empty data directory. Changing it in `.env` later does
not change it in Postgres — the services simply stop being able to log in. To
rotate, `ALTER` the roles in `psql` and edit `.env` in the same window.

**Staging must not be indexed.** It serves production's canonical URLs by design
(see `lib/site.ts`), so the nginx snippet sets `X-Robots-Tag: noindex` and puts
the app behind basic auth. Basic auth is deliberately *not* applied to the
`/auth/v1`, `/rest/v1` and `/realtime/v1` paths: a browser cannot send two
`Authorization` headers, so it would break sign-in and every API read.

**Secrets never cross environments.** `JWT_SECRET`, `ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` are generated together per environment. Copying
staging's into production would let a staging token authenticate against
production.
