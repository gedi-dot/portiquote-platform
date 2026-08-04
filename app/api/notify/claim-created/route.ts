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

  // A missing setting means claim alerts are silently dead. Returning ok here
  // is how a real claim sat unseen in the queue for eleven days: nothing in the
  // logs, nothing in the response, no way to tell it apart from a delivered
  // email. Fail loudly instead — the caller is fire-and-forget, so a 500 never
  // reaches the person filing the claim, whose claim has already saved.
  const adminEmail = process.env.EMAIL_ADMIN;
  if (!adminEmail) {
    console.error(
      "[claim-created] EMAIL_ADMIN is not set — nobody is being told about " +
        "new claims. Set it in the environment and redeploy."
    );
    return NextResponse.json({ error: "EMAIL_ADMIN not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("listing_claims")
    .select("id, claimant_id, business_email, role_at_company, created_at, forwarder_companies(company_name, slug)")
    .eq("id", claimId)
    .single();

  // only the person who filed it (and recently) can trigger the alert
  if (!claim || claim.claimant_id !== user.id) {
    console.warn("[claim-created] claim missing or not the caller's:", claimId);
    return NextResponse.json({ ok: true, notified: 0 });
  }
  if (Date.now() - new Date(claim.created_at).getTime() > 10 * 60 * 1000) {
    console.warn("[claim-created] claim older than 10 minutes, not alerting:", claimId);
    return NextResponse.json({ ok: true, notified: 0 });
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
