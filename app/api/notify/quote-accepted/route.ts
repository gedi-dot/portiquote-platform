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
  await sendEmails([
    {
      to: owner.email,
      subject: `You won the job · ${rfq.reference}`,
      html: emailShell({
        heading: "Your quote was accepted 🎉",
        bodyHtml: `<p>The shipper accepted your quote of <strong>${amount}</strong> on <strong>${escapeHtml(rfq.title)}</strong>.</p><p>Open the RFQ to message them and arrange documentation and pickup.</p>`,
        ctaLabel: "Open the RFQ",
        ctaPath: `/rfq/${rfq.id}`,
      }),
    },
  ]);
  return NextResponse.json({ ok: true, notified: 1 });
}
