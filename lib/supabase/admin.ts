import { createClient } from "@supabase/supabase-js";

// Server-ONLY Supabase client using the service-role key. Bypasses Row Level
// Security, so it is used by the M-Pesa callback / Stripe webhook to write
// payments and upgrade memberships. NEVER import this into a client component
// and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
