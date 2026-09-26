// Runtime configuration.
//
// Everything here is read when it is CALLED, not when the module is loaded,
// and deliberately avoids NEXT_PUBLIC_* names: Next inlines those into the
// build output, which is exactly what stops one image being promoted from
// staging to production unchanged.
//
// The NEXT_PUBLIC_* fallbacks keep local development and Vercel working, where
// the values do come from the build environment.

function trimSlash(url: string): string {
  return url.replace(/\/$/, "");
}

// This environment's own origin — https://staging.portiquote.com on staging,
// https://portiquote.com in production. Used for anything a user follows back
// into the app: email links and payment return URLs. Not used for canonical
// SEO URLs, which are pinned to production in lib/site.ts.
export function appOrigin(): string {
  return trimSlash(
    process.env.APP_ORIGIN ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000"
  );
}

// Where the server talks to Supabase. Inside the compose network this is the
// Kong gateway, so it is not the public origin the browser uses.
export function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return trimSlash(url);
}

export function supabaseAnonKey(): string {
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_ANON_KEY is not set");
  return key;
}

// Which environment this container is. Used to mark non-production instances in
// the UI so a staging tab is never mistaken for the live site.
export function appEnv(): string {
  return process.env.APP_ENV ?? "development";
}

// Names of the cookies middleware sets on every request, so both values follow
// the container rather than the build — which is what lets one image serve
// staging and production.
//
// The anon key is public: it only ever grants what RLS allows, which is why a
// JS-readable cookie is the right place for it.
export const ANON_KEY_COOKIE = "pq_anon";
export const ENV_COOKIE = "pq_env";
