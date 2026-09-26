import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/runtime";

// A cookie-free Supabase client for PUBLIC data on cacheable pages.
// The regular server client reads auth cookies, which forces Next to render
// the page on every request. This one doesn't, so pages using it can be
// statically cached and revalidated on a timer — the core of the speed pass.
// Only ever use it for data that is public to everyone (published listings,
// counts, posts); anything auth-aware must keep using the server client.
export function createPublicClient() {
  return createSupabaseClient(
    supabaseUrl(),
    supabaseAnonKey(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
