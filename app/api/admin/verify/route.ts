import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Toggle a forwarder's verified badge. Caller must be an admin
// (profiles.role = 'admin' — set via SQL, never self-service).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { forwarderId, verified } = await request.json().catch(() => ({}));
  if (!forwarderId || typeof verified !== "boolean") {
    return NextResponse.json(
      { error: "forwarderId and verified (boolean) required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("forwarder_companies")
    .update({ is_verified: verified })
    .eq("id", forwarderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
