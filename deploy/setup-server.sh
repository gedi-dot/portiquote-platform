#!/usr/bin/env bash
#
# One-time setup of the self-hosted PortiQuote deployment. Run as root:
#
#     sudo mkdir -p /opt/portiquote
#     sudo git clone https://github.com/gedi-dot/portiquote-platform /opt/portiquote/src
#     sudo bash /opt/portiquote/src/deploy/setup-server.sh
#
# Idempotent. It never overwrites an existing .env.
#
# Layout it creates, all root-owned so no tenant account can alter what the
# root-run deploy executes:
#
#   /opt/portiquote/src/            git checkout of main
#   /opt/portiquote/compose.yaml    container definition (644)
#   /opt/portiquote/.env            secrets (600)
#   /usr/local/sbin/portiquote-deploy
#   /usr/local/sbin/portiquote-cron
#   /etc/cron.d/portiquote          06:30 UTC membership housekeeping

set -euo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

ROOT=/opt/portiquote
REPO=https://github.com/gedi-dot/portiquote-platform
HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  \033[32mv\033[0m %s\n' "$*"; }
die() { printf '  \033[31mX %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run with sudo."

say "Preflight"
for tool in docker git curl flock ss; do
    command -v "$tool" > /dev/null || die "$tool is not installed"
done
docker compose version > /dev/null 2>&1 || die "the docker compose plugin is not installed"
systemctl is-active --quiet docker || die "docker is not running"
ok "docker $(docker version --format '{{.Server.Version}}'), compose $(docker compose version --short)"

say "Files"
install -d -o root -g root -m 755 "$ROOT"
if [ ! -d "${ROOT}/src/.git" ]; then
    git clone --quiet "$REPO" "${ROOT}/src"
    ok "cloned $REPO"
else
    ok "checkout already present"
fi
install -o root -g root -m 644 "${HERE}/compose.yaml" "${ROOT}/compose.yaml"
install -o root -g root -m 755 "${HERE}/portiquote-deploy" /usr/local/sbin/portiquote-deploy
install -o root -g root -m 755 "${HERE}/portiquote-cron"   /usr/local/sbin/portiquote-cron
ok "compose.yaml, portiquote-deploy, portiquote-cron installed"

if [ -f "${ROOT}/.env" ]; then
    ok ".env exists — left untouched"
else
    install -o root -g root -m 600 "${HERE}/env.production.example" "${ROOT}/.env"
    # Generate the one value nobody has to look up.
    sed -i "s/^CRON_SECRET=.*/CRON_SECRET=$(openssl rand -hex 32)/" "${ROOT}/.env"
    ok ".env created from the template (CRON_SECRET generated) — fill in the rest"
fi
chmod 600 "${ROOT}/.env"

say "Port"
PORT="$(sed -n 's/^PORTIQUOTE_HOST_PORT=//p' "${ROOT}/.env" | tr -d '"' | tail -1)"
PORT="${PORT:-3100}"
if ss -ltn "sport = :${PORT}" | grep -q LISTEN \
   && ! docker ps --format '{{.Names}} {{.Ports}}' | grep -q "portiquote.*:${PORT}->"; then
    die "port ${PORT} is already in use — set PORTIQUOTE_HOST_PORT in ${ROOT}/.env to a free one"
fi
ok "127.0.0.1:${PORT} is available to PortiQuote"

say "Cron"
cat > /etc/cron.d/portiquote <<EOF
# PortiQuote membership housekeeping. Vercel's cron runs at 06:00; this one is
# 30 minutes later so the two never overlap while both deployments exist.
30 6 * * * root /usr/local/sbin/portiquote-cron >> ${ROOT}/cron.log 2>&1
EOF
chmod 644 /etc/cron.d/portiquote
ok "/etc/cron.d/portiquote (06:30 UTC daily)"

say "DirectAdmin"
OWNER="$(awk -F': ' '$1=="portiquote.com"{print $2}' /etc/virtual/domainowners 2>/dev/null || true)"
if [ -n "$OWNER" ]; then
    ok "portiquote.com belongs to DirectAdmin user '${OWNER}'"
else
    echo "  portiquote.com is not in /etc/virtual/domainowners — add it in DirectAdmin first"
fi
# The proven way to proxy a domain on THIS server is whatever the existing
# proxied sites already use, so show those rather than guess at template tokens.
echo "  Existing custom nginx proxies on this server, to copy the pattern from:"
grep -l 'proxy_pass' /usr/local/directadmin/data/users/*/domains/*.cust_nginx* 2>/dev/null \
    | sed 's/^/    /' || echo "    (none found)"

say "Next"
cat <<EOF
  1. Fill in ${ROOT}/.env        (sudo nano ${ROOT}/.env)
  2. Deploy:                      sudo portiquote-deploy
  3. Check it locally:            curl -sI http://127.0.0.1:${PORT}/ | head -1
  4. Issue the SSL certificate for portiquote.com + www in DirectAdmin
  5. Point the domain at 127.0.0.1:${PORT} (DEPLOY.md, "nginx")
EOF
