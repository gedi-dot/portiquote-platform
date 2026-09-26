import { createBrowserClient } from "@supabase/ssr";
import { ANON_KEY_COOKIE } from "@/lib/runtime";

// Browser-side Supabase client, for use inside "use client" components
// (sign in, sign up, and other interactive flows).
//
// Neither value is baked in at build time, so one image serves both staging and
// production:
//
//   url — the current origin. DirectAdmin's nginx proxies /auth/v1, /rest/v1
//         and /realtime/v1 to this environment's Kong gateway, so Supabase is
//         same-origin as far as the browser is concerned.
//   key — the anon key, set as a cookie by middleware on every request.
//
// The NEXT_PUBLIC_* values win when present, which keeps local development and
// Vercel working against a Supabase instance on another host.
//
// Every caller invokes this from an event handler or an effect, never during
// render, so `window` and `document` are always available.

function cookieValue(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || cookieValue(ANON_KEY_COOKIE);

  if (!key) {
    // Middleware sets the cookie on every page response, so an empty key means
    // it did not run — a matcher change, or a response served from outside it.
    throw new Error(
      `No Supabase anon key: neither NEXT_PUBLIC_SUPABASE_ANON_KEY nor the ` +
        `${ANON_KEY_COOKIE} cookie is set.`
    );
  }

  return createBrowserClient(url, key);
}
