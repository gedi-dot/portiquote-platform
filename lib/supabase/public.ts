import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Anonymous, cookie-free client for public data in cacheable contexts
// (sitemap generation). RLS still applies — it sees only published rows.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
