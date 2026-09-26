import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ANON_KEY_COOKIE,
  ENV_COOKIE,
  appEnv,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/runtime";

// Refreshes the Supabase auth session on every request so Server Components
// always read a valid session. Do not run other logic between
// createServerClient() and getUser().
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  // Hand the anon key to the browser. Middleware runs at request time in every
  // environment, so this is what lets one image serve both staging and
  // production: the key follows the container, not the build. Only written when
  // missing or stale, to keep Set-Cookie off otherwise cacheable responses.
  const readable = {
    // Read by browser code, so neither may be httpOnly.
    httpOnly: false,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };

  const anonKey = supabaseAnonKey();
  if (request.cookies.get(ANON_KEY_COOKIE)?.value !== anonKey) {
    supabaseResponse.cookies.set(ANON_KEY_COOKIE, anonKey, readable);
  }

  // Lets components/EnvBadge.tsx mark non-production instances. It has to come
  // from here rather than be read on the server during render: most pages are
  // statically prerendered, so a server-read value would be baked in at build
  // time and would be identical in both environments.
  const env = appEnv();
  if (request.cookies.get(ENV_COOKIE)?.value !== env) {
    supabaseResponse.cookies.set(ENV_COOKIE, env, readable);
  }

  return supabaseResponse;
}
