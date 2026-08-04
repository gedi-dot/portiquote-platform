import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

// Approve or reject a listing claim. Approval transfers ownership:
// the listing gains its owner, the claimant becomes a forwarder.
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

  const { claimId, action } = await request.json().catch(() => ({}));
  if (!claimId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "claimId and action (approve|reject) required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("listing_claims")
    .select("id, forwarder_id, claimant_id, status")
    .eq("id", claimId)
    .single();
  if (!claim || claim.status !== "pending") {
    return NextResponse.json({ error: "Claim not found or already decided" }, { status: 404 });
  }

  const { data: fwd } = await admin
    .from("forwarder_companies")
    .select("id, company_name, slug, is_claimed")
    .eq("id", claim.forwarder_id)
    .single();
  if (!fwd) return NextResponse.json({ error: "Listing missing" }, { status: 404 });

  if (action === "approve") {
    if (fwd.is_claimed) {
      return NextResponse.json({ error: "Listing already claimed" }, { status: 409 });
    }
    await admin
      .from("forwarder_companies")
      .update({ owner_id: claim.claimant_id, is_claimed: true })
      .eq("id", fwd.id);
    await admin
      .from("profiles")
      .update({ role: "forwarder" })
      .eq("id", claim.claimant_id)
      .neq("role", "admin")
      .neq("role", "admin") // approving a claim must not demote an admin;
  }

  await admin
    .from("listing_claims")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", claim.id);

  // Tell the claimant
  const { data: claimant } = await admin
    .from("profiles")
    .select("email")
    .eq("id", claim.claimant_id)
    .single();
  if (claimant?.email) {
    const approved = action === "approve";
    await sendEmails([
      {
        to: claimant.email,
        subject: approved
          ? `Your listing is yours — ${fwd.company_name}`
          : `About your claim for ${fwd.company_name}`,
        html: emailShell({
          heading: approved ? "Claim approved ✓" : "Claim not approved",
          bodyHtml: approved
            ? `<p><strong>${escapeHtml(fwd.company_name)}</strong> is now under your control. Update your services and trade lanes, add contact details — and go Premium to receive RFQ leads on your lanes.</p>`
            : `<p>We couldn't verify this claim for <strong>${escapeHtml(fwd.company_name)}</strong>. If you believe this is a mistake, reply with more proof (a company-domain email or registration document) and we'll look again.</p>`,
          ctaLabel: approved ? "Manage your listing" : "View the listing",
          ctaPath: approved ? `/forwarders/${fwd.slug}/edit` : `/forwarders/${fwd.slug}`,
        }),
      },
    ]);
  }

  return NextResponse.json({ ok: true });
}
