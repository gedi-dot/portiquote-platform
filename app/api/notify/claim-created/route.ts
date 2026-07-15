import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

// A claim was filed — alert the platform admin inbox.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { claimId } = await request.json().catch(() => ({}));
  if (!claimId) return NextResponse.json({ error: "claimId required" }, { status: 400 });

  const adminEmail = process.env.EMAIL_ADMIN;
  if (!adminEmail) return NextResponse.json({ ok: true, skipped: "EMAIL_ADMIN not set" });

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("listing_claims")
    .select("id, claimant_id, business_email, role_at_company, created_at, forwarder_companies(company_name, slug)")
    .eq("id", claimId)
    .single();

  // only the person who filed it (and recently) can trigger the alert
  if (!claim || claim.claimant_id !== user.id) {
    return NextResponse.json({ ok: true });
  }
  if (Date.now() - new Date(claim.created_at).getTime() > 10 * 60 * 1000) {
    return NextResponse.json({ ok: true });
  }

  const fwd = claim.forwarder_companies as unknown as
    | { company_name: string; slug: string }
    | null;

  await sendEmails([
    {
      to: adminEmail,
      subject: `New listing claim: ${fwd?.company_name ?? "unknown"}`,
      html: emailShell({
        heading: "A forwarder wants their listing",
        bodyHtml: `<p><strong>${escapeHtml(fwd?.company_name ?? "Unknown")}</strong> has a new claim${
          claim.role_at_company ? ` from a ${escapeHtml(claim.role_at_company)}` : ""
        }${claim.business_email ? ` (${escapeHtml(claim.business_email)})` : ""}. Verify and decide in the admin queue.</p>`,
        ctaLabel: "Open the claims queue",
        ctaPath: "/admin",
      }),
    },
  ]);

  return NextResponse.json({ ok: true });
}
