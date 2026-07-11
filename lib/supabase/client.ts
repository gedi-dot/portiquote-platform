import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client, for use inside "use client" components
// (sign in, sign up, and other interactive flows).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
