import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

// Quote accepted -> email the winning forwarder's owner.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { quoteId } = await request.json().catch(() => ({}));
  if (!quoteId) return NextResponse.json({ error: "quoteId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: quote } = await admin
    .from("quotes")
    .select("id, rfq_id, forwarder_id, amount, currency")
    .eq("id", quoteId)
    .single();
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: rfq } = await admin
    .from("rfqs")
    .select("id, reference, title, shipper_id")
    .eq("id", quote.rfq_id)
    .single();
  // Only the shipper who owns the RFQ can trigger this.
  if (!rfq || rfq.shipper_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The shipper's contact details, so the winning forwarder can reach them
  // directly to arrange documentation and pickup.
  const { data: shipper } = await admin
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", rfq.shipper_id)
    .single();

  const { data: fwd } = await admin
    .from("forwarder_companies")
    .select("company_name, owner_id")
    .eq("id", quote.forwarder_id)
    .single();
  const { data: owner } = fwd
    ? await admin.from("profiles").select("email").eq("id", fwd.owner_id).single()
    : { data: null };
  if (!owner?.email) return NextResponse.json({ ok: true, notified: 0 });

  const amount = `${quote.currency} ${Number(quote.amount).toLocaleString()}`;

  const contactRows =
    `<table style="width:100%;border-collapse:collapse;">` +
    (shipper?.full_name
      ? `<tr><td style="padding:4px 0;color:#0B4A54;font-size:13px;">Contact</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#062A2E;font-weight:600;">${escapeHtml(
          shipper.full_name
        )}</td></tr>`
      : "") +
    (shipper?.email
      ? `<tr><td style="padding:4px 0;color:#0B4A54;font-size:13px;">Email</td><td style="padding:4px 0;text-align:right;font-size:13px;"><a href="mailto:${escapeHtml(
          shipper.email
        )}" style="color:#0B4A54;">${escapeHtml(shipper.email)}</a></td></tr>`
      : "") +
    (shipper?.phone
      ? `<tr><td style="padding:4px 0;color:#0B4A54;font-size:13px;">Phone</td><td style="padding:4px 0;text-align:right;font-size:13px;"><a href="tel:${escapeHtml(
          shipper.phone
        )}" style="color:#0B4A54;">${escapeHtml(shipper.phone)}</a></td></tr>`
      : "") +
    `</table>`;

  await sendEmails([
    {
      to: owner.email,
      subject: `You won the job · ${rfq.reference}`,
      html: emailShell({
        heading: "Your quote was accepted 🎉",
        bodyHtml:
          `<p>The shipper accepted your quote of <strong>${amount}</strong> on <strong>${escapeHtml(
            rfq.title
          )}</strong>.</p>` +
          `<div style="background:#F5EFE1;border-radius:10px;padding:14px 16px;margin:16px 0;">
             <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0B4A54;">Contact the shipper to arrange it</p>
             ${contactRows}
           </div>` +
          `<p style="font-size:13px;color:#0B4A54;">You can also message them on the platform.</p>`,
        ctaLabel: "Open the RFQ",
        ctaPath: `/rfq/${rfq.id}`,
      }),
    },
  ]);
  return NextResponse.json({ ok: true, notified: 1 });
}
