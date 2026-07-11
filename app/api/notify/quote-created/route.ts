import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

// New quote -> email the shipper who owns the RFQ.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { rfqId, forwarderId } = await request.json().catch(() => ({}));
  if (!rfqId || !forwarderId) {
    return NextResponse.json({ error: "rfqId and forwarderId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  // The caller must own the forwarder that quoted.
  const { data: fwd } = await admin
    .from("forwarder_companies")
    .select("id, owner_id, company_name")
    .eq("id", forwarderId)
    .single();
  if (!fwd || fwd.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: quote } = await admin
    .from("quotes")
    .select("amount, currency, transit_time_days")
    .eq("rfq_id", rfqId)
    .eq("forwarder_id", forwarderId)
    .single();
  const { data: rfq } = await admin
    .from("rfqs")
    .select("id, reference, title, shipper_id")
    .eq("id", rfqId)
    .single();
  if (!quote || !rfq) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: shipper } = await admin
    .from("profiles")
    .select("email")
    .eq("id", rfq.shipper_id)
    .single();
  if (!shipper?.email) return NextResponse.json({ ok: true, notified: 0 });

  const amount = `${quote.currency} ${Number(quote.amount).toLocaleString()}`;
  const transit = quote.transit_time_days ? ` · ${quote.transit_time_days}d transit` : "";
  await sendEmails([
    {
      to: shipper.email,
      subject: `New quote: ${amount} · ${rfq.reference}`,
      html: emailShell({
        heading: "You received a quote",
        bodyHtml: `<p><strong>${escapeHtml(fwd.company_name)}</strong> quoted <strong>${amount}</strong>${transit} on <strong>${escapeHtml(rfq.title)}</strong>.</p><p>Compare it side by side with the others and accept when you're ready.</p>`,
        ctaLabel: "Compare quotes",
        ctaPath: `/rfq/${rfq.id}`,
      }),
    },
  ]);
  return NextResponse.json({ ok: true, notified: 1 });
}
