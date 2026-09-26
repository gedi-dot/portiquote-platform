import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANON_KEY_COOKIE, supabaseAnonKey, supabaseUrl } from "@/lib/runtime";

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
  const anonKey = supabaseAnonKey();
  if (request.cookies.get(ANON_KEY_COOKIE)?.value !== anonKey) {
    supabaseResponse.cookies.set(ANON_KEY_COOKIE, anonKey, {
      // Read by lib/supabase/client.ts, so it must not be httpOnly. The anon
      // key is public and only ever grants what RLS allows.
      httpOnly: false,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return supabaseResponse;
}
