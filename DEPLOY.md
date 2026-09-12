# Self-hosted deployment — portiquote.com

PortiQuote runs on the Contabo/DirectAdmin server as a Docker container bound to
`127.0.0.1:3100`. DirectAdmin's nginx owns the domain and its Let's Encrypt
certificate and proxies to the container. The Vercel deployment is independent;
nothing here changes it.

```
browser ──https──> DirectAdmin nginx (portiquote.com, SSL) ──> 127.0.0.1:3100
                                                                  │
                                                  portiquote-web container (Next.js)
                                                                  │
                                                  Supabase (database, auth, realtime)
```

**Why a container rather than DirectAdmin's own hosting.** Next.js is a
long-running Node server, not files to copy into `public_html`, and DirectAdmin
has no process manager for Node unless the server runs CloudLinux. The database
is Supabase, so there is nothing to host locally. The container pins the Node
version and restarts on its own, and it matches how the other apps in `/opt`
already run.

## First-time setup

On the server, as an account with sudo.

### 1. Deploy key

The repository is private, so the server reads it with its own key. Create it:

```bash
sudo install -d -m 700 /root/.ssh
sudo ssh-keygen -t ed25519 -N "" -C "portiquote-deploy@srv1" -f /root/.ssh/portiquote_deploy
sudo cat /root/.ssh/portiquote_deploy.pub
```

A repository admin adds that line under GitHub → Settings → **Deploy keys** →
*Add deploy key*, with **Allow write access unticked**. The key can then read
this one repository and nothing else, and removing it there cuts the server off.

### 2. Clone and set up

```bash
# GitHub's published host key, so the first connection is verified, not trusted blindly
echo "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl" \
    | sudo tee -a /root/.ssh/known_hosts
sudo mkdir -p /opt/portiquote
sudo env GIT_SSH_COMMAND="ssh -i /root/.ssh/portiquote_deploy -o IdentitiesOnly=yes" \
    git clone git@github.com:gedi-dot/portiquote-platform.git /opt/portiquote/src
sudo bash /opt/portiquote/src/deploy/setup-server.sh
sudo nano /opt/portiquote/.env      # copy the values from Vercel's env settings
sudo portiquote-deploy
```

`setup-server.sh` is idempotent and never overwrites `.env`.

### SSL

DirectAdmin → portiquote.com → **SSL Certificates** → *Free & automatic
certificate from Let's Encrypt* → tick `portiquote.com` and `www.portiquote.com`
→ **Save**. Then *Domain Setup* → **Force SSL with https redirect**.

Issue the certificate *before* adding the proxy below, while the domain still
serves its own `public_html`.

### nginx

DirectAdmin → *Server Manager* → **Custom HTTPD Configurations** →
portiquote.com → nginx. `setup-server.sh` lists the domains on this server that
already proxy to a container; copy their structure and change the port. The
proxy itself is:

```nginx
location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

No websocket upgrade is needed: realtime messaging connects the browser
straight to Supabase.

## Deploying changes

```bash
sudo portiquote-deploy
```

It pulls `main`, builds, starts the new container and checks two URLs:
`/robots.txt` (Node is up) and `/directory` (the container can reach Supabase).
If either fails it puts the previous image back. History is in
`/opt/portiquote/deploy.log`.

Changes to `.env` values starting `NEXT_PUBLIC_` need a redeploy, because they
are compiled into the page bundle. Other values need only
`sudo docker compose -f /opt/portiquote/compose.yaml up -d`.

## Running alongside Vercel

Both deployments use the same Supabase project, so they share every account,
listing and payment. Most of that just works. Three things need attention.

**1. Supabase auth redirect URLs — required before anyone signs up here.**
Signup confirmation and password reset emails send users back to whichever site
they started on, but only if Supabase allows that URL. Otherwise it silently
falls back to the *Site URL*, the Vercel one, and users land on the wrong site.

Supabase → Authentication → **URL Configuration**:
- *Redirect URLs*: add `https://portiquote.com/**` and
  `https://www.portiquote.com/**`. Leave the Vercel entry until Vercel is gone.
- *Site URL*: set to `https://portiquote.com`.

**2. Payment webhooks — keep ONE endpoint per provider.**
Stripe and Paystack call a single webhook URL configured in their dashboards.
Leave it pointing at Vercel for now. A payment started on portiquote.com is
still confirmed, because the Vercel handler writes to the same database.

Do **not** register a second endpoint for portiquote.com alongside it. Both
would receive every event, and the handler's already-processed check is
read-then-write rather than atomic. Two simultaneous deliveries can both grant
30 days of Premium.

M-Pesa is unaffected: its callback URL is sent with each payment request, so
`MPESA_CALLBACK_URL` in `.env` already routes portiquote.com's payments here.

**3. Cron.** Vercel's runs at 06:00 UTC, this one at 06:30. Reminders are
marked sent in the database, so the second run finds nothing to do. When Vercel
is removed, this one simply carries on.

## Removing Vercel later

1. Stripe → Developers → Webhooks: change the endpoint to
   `https://portiquote.com/api/stripe/webhook`. Put its new signing secret in
   `STRIPE_WEBHOOK_SECRET`, then run `docker compose up -d` as above.
2. Paystack → Settings → API Keys & Webhooks: webhook URL →
   `https://portiquote.com/api/paystack/webhook`.
3. Supabase → URL Configuration: remove the Vercel redirect URL.
4. Delete the Vercel project. `vercel.json` can stay; nothing else reads it.
