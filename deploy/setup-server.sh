#!/usr/bin/env bash
#
# One-time setup of the two self-hosted PortiQuote environments. Run as root:
#
#     git clone --depth 1 https://github.com/gedi-dot/portiquote-platform /tmp/pq
#     sudo bash /tmp/pq/deploy/setup-server.sh
#
# The clone is only needed here, to copy these files into place. Delete it
# afterwards if you like: portiquote-deploy pulls published images and never
# reads a checkout. That is deliberate — the deploy runs as root, and a
# compose file read live from the repository would let anyone with push access
# mount the host filesystem into a root-run container.
#
# Idempotent. It never overwrites an existing .env, and never touches a database
# that already exists.
#
# Layout it creates, all root-owned so no tenant account can alter what the
# root-run deploy executes:
#
#   /opt/portiquote/production/     compose.yaml, .env (600), volumes/, migrations/
#   /opt/portiquote/staging/        the same, on its own ports and secrets
#   /etc/nginx/portiquote-staging.htpasswd
#   /usr/local/sbin/portiquote-deploy
#   /usr/local/sbin/portiquote-cron
#   /etc/cron.d/portiquote         06:30 UTC membership housekeeping

set -euo pipefail
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

ROOT=/opt/portiquote
IMAGE=ghcr.io/gedi-dot/portiquote-platform
HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
# Deliberately NOT under /etc/nginx. That directory is not traversable by the
# nginx worker user on this server, and auth_basic_user_file is read by the
# worker at request time, not by the root master at startup — so a file there
# fails with "Permission denied" and every authenticated request 500s.
HTPASSWD_DIR=/etc/portiquote
HTPASSWD="${HTPASSWD_DIR}/staging.htpasswd"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  \033[32mv\033[0m %s\n' "$*"; }
note(){ printf '    %s\n' "$*"; }
die() { printf '  \033[31mX %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run with sudo."

# ------------------------------------------------------------------ preflight --
say "Preflight"
for tool in docker curl flock ss openssl sed awk; do
    command -v "$tool" > /dev/null || die "$tool is not installed"
done
docker compose version > /dev/null 2>&1 || die "the docker compose plugin is not installed"
systemctl is-active --quiet docker || die "docker is not running"
ok "docker $(docker version --format '{{.Server.Version}}'), compose $(docker compose version --short)"

# Two Postgres instances plus two Node servers on an 11G box that also hosts
# other customers. Without swap, pressure means an OOM kill rather than a stall.
if [ "$(awk '/^SwapTotal:/{print $2}' /proc/meminfo)" -lt 1048576 ]; then
    die "less than 1G of swap. Add some first:
    sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
    sudo mkswap /swapfile && sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
fi
ok "swap $(awk '/^SwapTotal:/{printf "%.1fG", $2/1048576}' /proc/meminfo)"

# ------------------------------------------------------------------- secrets --
# base64url without padding, as JWT requires.
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

# Mints the anon and service_role keys. They are ordinary HS256 JWTs signed with
# JWT_SECRET, which is the whole reason all three values must be generated
# together and per environment: a key signed with staging's secret would be
# accepted by staging only, and vice versa.
mint_jwt() {
    local role="$1" secret="$2" iat exp hdr payload unsigned sig
    iat="$(date +%s)"
    exp="$((iat + 315360000))"   # ten years; these are infrastructure keys
    hdr='{"alg":"HS256","typ":"JWT"}'
    payload="{\"role\":\"${role}\",\"iss\":\"supabase\",\"iat\":${iat},\"exp\":${exp}}"
    unsigned="$(printf '%s' "$hdr" | b64url).$(printf '%s' "$payload" | b64url)"
    sig="$(printf '%s' "$unsigned" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)"
    printf '%s.%s' "$unsigned" "$sig"
}

setenv() {   # setenv <file> <key> <value>
    local f="$1" k="$2" v="$3" tmp
    tmp="$(mktemp)"
    # The value goes through the environment rather than into the program text,
    # so slashes, `&` and base64 padding in a generated secret cannot be
    # misread as substitution syntax — which is exactly what a plain sed would
    # do here, silently and only for some randomly generated keys.
    K="$k" V="$v" awk '
        BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"]; done = 0 }
        !done && index($0, k "=") == 1 { print k "=" v; done = 1; next }
        { print }
        END { if (!done) print k "=" v }
    ' "$f" > "$tmp"
    # Written back through the original file so its 600 mode survives.
    cat "$tmp" > "$f"
    rm -f "$tmp"
}

# --------------------------------------------------------------- environments --
install -d -o root -g root -m 755 "$ROOT"

for ENV in production staging; do
    say "Environment: ${ENV}"
    D="${ROOT}/${ENV}"

    install -d -o root -g root -m 755 "$D" "${D}/migrations" \
        "${D}/supabase" "${D}/supabase/init-scripts" "${D}/supabase/migrations" \
        "${D}/volumes" "${D}/volumes/db"
    # volumes/db/data is deliberately NOT created here. Postgres requires it to
    # be owned by its own user and mode 700, and the image's entrypoint arranges
    # that on first start. A root-owned directory pre-made here would fail that
    # check and the container would refuse to initialise.

    install -o root -g root -m 644 "${HERE}/compose.yaml"                        "${D}/compose.yaml"
    install -o root -g root -m 644 "${HERE}/supabase/gateway.conf"               "${D}/supabase/gateway.conf"
    install -o root -g root -m 644 "${HERE}/supabase/init-scripts/99-roles.sql"  "${D}/supabase/init-scripts/99-roles.sql"
    install -o root -g root -m 644 "${HERE}/supabase/init-scripts/99-jwt.sql"    "${D}/supabase/init-scripts/99-jwt.sql"
    install -o root -g root -m 644 "${HERE}/supabase/migrations/99-realtime.sql" "${D}/supabase/migrations/99-realtime.sql"
    ok "compose.yaml and the Supabase init files installed"

    if [ -f "${D}/.env" ]; then
        ok ".env exists — left untouched"
    else
        install -o root -g root -m 600 "${HERE}/env.example" "${D}/.env"

        JWT_SECRET="$(openssl rand -hex 32)"
        setenv "${D}/.env" APP_ENV                   "$ENV"
        setenv "${D}/.env" IMAGE                     "$IMAGE"
        setenv "${D}/.env" IMAGE_TAG                 ""
        setenv "${D}/.env" POSTGRES_PASSWORD         "$(openssl rand -hex 24)"
        setenv "${D}/.env" JWT_SECRET                "$JWT_SECRET"
        setenv "${D}/.env" ANON_KEY                  "$(mint_jwt anon "$JWT_SECRET")"
        setenv "${D}/.env" SUPABASE_SERVICE_ROLE_KEY "$(mint_jwt service_role "$JWT_SECRET")"
        # Exactly 16 characters: realtime refuses to start otherwise, and says so
        # in a way that does not mention the length.
        setenv "${D}/.env" REALTIME_DB_ENC_KEY       "$(openssl rand -hex 8)"
        setenv "${D}/.env" SECRET_KEY_BASE           "$(openssl rand -hex 32)"
        setenv "${D}/.env" CRON_SECRET               "$(openssl rand -hex 32)"

        if [ "$ENV" = production ]; then
            setenv "${D}/.env" APP_ORIGIN         "https://portiquote.com"
            setenv "${D}/.env" PORT_APP           "3400"
            setenv "${D}/.env" PORT_SUPABASE      "8400"
            setenv "${D}/.env" MPESA_CALLBACK_URL "https://portiquote.com/api/mpesa/callback"
        else
            setenv "${D}/.env" APP_ORIGIN         "https://staging.portiquote.com"
            setenv "${D}/.env" PORT_APP           "3410"
            setenv "${D}/.env" PORT_SUPABASE      "8410"
            setenv "${D}/.env" MPESA_CALLBACK_URL "https://staging.portiquote.com/api/mpesa/callback"
            # Leaner: staging serves one or two people at a time.
            setenv "${D}/.env" MEM_DB             "512m"
            setenv "${D}/.env" MEM_REALTIME       "256m"
            setenv "${D}/.env" MEM_WEB            "512m"
        fi
        ok ".env created, secrets generated"
        note "still to fill in by hand: SMTP_PASS, EMAIL_ADMIN, and the payment keys"
    fi
    chmod 600 "${D}/.env"

    # Ports
    for key in PORT_APP PORT_SUPABASE; do
        P="$(sed -n "s/^${key}=//p" "${D}/.env" | tr -d '"' | tail -1)"
        if ss -ltn "sport = :${P}" | grep -q LISTEN \
           && ! docker ps --format '{{.Names}} {{.Ports}}' | grep -q "portiquote-${ENV}.*:${P}->"; then
            die "port ${P} (${key}) is in use by something else — pick another in ${D}/.env"
        fi
    done
    ok "ports free or already ours"
done

# ----------------------------------------------------------- staging password --
say "Staging basic auth"
install -d -o root -g root -m 755 "$HTPASSWD_DIR"
if [ -f "$HTPASSWD" ]; then
    ok "${HTPASSWD} exists — left untouched"
else
    STAGING_PW="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
    # apr1 rather than bcrypt: nginx supports it everywhere, and openssl can
    # produce it without needing apache2-utils installed.
    printf 'portiquote:%s\n' "$(openssl passwd -apr1 "$STAGING_PW")" > "$HTPASSWD"
    chmod 644 "$HTPASSWD"     # hashes, read by the nginx worker
    chown root:root "$HTPASSWD"
    ok "created ${HTPASSWD}"
    note "username: portiquote"
    note "password: ${STAGING_PW}"
    note "Write it down — it is not stored anywhere in plaintext."
fi

# --------------------------------------------------------------- commands ----
say "Commands"
install -o root -g root -m 755 "${HERE}/portiquote-deploy" /usr/local/sbin/portiquote-deploy
install -o root -g root -m 755 "${HERE}/portiquote-cron"   /usr/local/sbin/portiquote-cron
install -o root -g root -m 755 "${HERE}/portiquote-backup" /usr/local/sbin/portiquote-backup
ok "portiquote-deploy, portiquote-cron, portiquote-backup installed"

cat > /etc/cron.d/portiquote <<EOF
# Cron needs an explicit PATH; the one it supplies does not include docker.
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Nightly database dump, kept 14 days. Self-hosting means nobody else is taking
# these. Production only: staging can be rebuilt from a migration run.
15 2 * * * root /usr/local/sbin/portiquote-backup production >> ${ROOT}/production/backup.log 2>&1

# Membership housekeeping: renewal reminders, then expiring lapsed Premium.
# Production only — staging has no real memberships to expire.
30 6 * * * root /usr/local/sbin/portiquote-cron production >> ${ROOT}/production/cron.log 2>&1
EOF
chmod 644 /etc/cron.d/portiquote
ok "/etc/cron.d/portiquote (02:15 backup, 06:30 housekeeping, production only)"

# -------------------------------------------------------------- DirectAdmin ---
say "DirectAdmin"
# Only real domains appear in domainowners. A subdomain belongs to its parent, so
# staging.portiquote.com is never listed there — look in the parent's subdomain
# list instead, or an existing subdomain reads as missing.
OWNER="$(awk -F': ' '$1=="portiquote.com"{print $2}' /etc/virtual/domainowners 2>/dev/null || true)"
if [ -n "$OWNER" ]; then
    ok "portiquote.com belongs to DirectAdmin user '${OWNER}'"
    DOMDIR="/usr/local/directadmin/data/users/${OWNER}/domains"
    # Subdomains are listed in the parent's .subdomains file, one bare label per
    # line — they are NOT separate entries in domainowners. A subdomain does get
    # its own custom-config files, named by its full name in this same directory,
    # but only once a custom config has been created, so their absence proves
    # nothing about whether the subdomain exists.
    if grep -qx 'staging' "${DOMDIR}/portiquote.com.subdomains" 2>/dev/null; then
        ok "the staging subdomain exists"
    else
        note "no 'staging' line in ${DOMDIR}/portiquote.com.subdomains"
        note "add the subdomain in DirectAdmin -> Subdomain Management first"
    fi
    note "install the nginx snippets from ${HERE}/nginx/ into:"
    note "  ${DOMDIR}/"
else
    note "portiquote.com is NOT in /etc/virtual/domainowners — add it in DirectAdmin first"
fi

say "Next"
cat <<EOF
  1. Fill in the blanks:   sudo nano ${ROOT}/staging/.env
                           sudo nano ${ROOT}/production/.env
  2. Only if step 4 fails with "denied", the GHCR package is private:
     github.com/gedi-dot/portiquote-platform/pkgs/container/portiquote-platform
     -> Package settings -> Change visibility -> Public
     (a package published from a public repository is usually public already)
  3. Install the nginx snippets (see ${HERE}/nginx/).
  4. Deploy staging first:  sudo portiquote-deploy staging main
  5. Check it:              curl -sI http://127.0.0.1:3410/ | head -1
  6. Then production:       sudo portiquote-deploy production <a v* tag>
EOF
