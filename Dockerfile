# Self-hosted production image. Built once by .github/workflows/release.yml and
# published to GHCR; the same image is promoted from staging to production by
# re-tagging the digest. Vercel ignores this file.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# only things that are the SAME in every environment may appear here. The
# Supabase URL and anon key are deliberately absent: the browser reaches
# Supabase same-origin and reads the anon key from a cookie middleware sets,
# so one image serves staging and production. See lib/supabase/client.ts.
#
# The site URL is the exception — canonical and Open Graph URLs end up in
# statically rendered HTML, so they must be production's address everywhere.
# Per-environment links use APP_ORIGIN at runtime. See lib/site.ts.
ARG NEXT_PUBLIC_SITE_URL=https://portiquote.com
ARG NEXT_PUBLIC_SITE_NAME=PortiQuote
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Owned by node so cached pages (revalidate) can be rewritten at runtime.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Carried in the image so the schema and the code that expects it are one
# artefact and cannot disagree about a version. portiquote-deploy extracts these
# and applies them before starting the new container.
COPY --from=build --chown=node:node /app/migrations ./migrations
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO /dev/null http://127.0.0.1:3000/robots.txt || exit 1
CMD ["node", "server.js"]
