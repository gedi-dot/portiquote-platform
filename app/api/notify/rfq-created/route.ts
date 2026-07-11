import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";
import { countryCode, modeLabel } from "@/lib/format";

export const runtime = "nodejs";

// New RFQ -> email every Premium forwarder with a matching lane.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { rfqId } = await request.json().catch(() => ({}));
  if (!rfqId) return NextResponse.json({ error: "rfqId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: rfq } = await admin
    .from("rfqs")
    .select("id, shipper_id, reference, title, mode, origin_country, destination_country")
    .eq("id", rfqId)
    .single();
  // Only the shipper who posted it can trigger its notifications.
  if (!rfq || rfq.shipper_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Lanes matching the RFQ's corridor…
  const { data: lanes } = await admin
    .from("forwarder_lanes")
    .select("forwarder_id")
    .eq("origin_country", rfq.origin_country)
    .eq("destination_country", rfq.destination_country);
  const laneFwdIds = [...new Set((lanes ?? []).map((l) => l.forwarder_id))];
  if (laneFwdIds.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  // …owned by published Premium members…
  const { data: fwds } = await admin
    .from("forwarder_companies")
    .select("id, owner_id")
    .in("id", laneFwdIds)
    .eq("membership_tier", "premium")
    .eq("is_published", true);
  const ownerIds = [...new Set((fwds ?? []).map((f) => f.owner_id))];
  if (ownerIds.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  // …and email their owners.
  const { data: owners } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", ownerIds);

  const lane = `${countryCode(rfq.origin_country)} → ${countryCode(rfq.destination_country)}`;
  const mails = (owners ?? [])
    .filter((o) => o.email)
    .map((o) => ({
      to: o.email as string,
      subject: `New RFQ on your lane · ${lane} · ${rfq.reference}`,
      html: emailShell({
        heading: "New lead on your lane",
        bodyHtml: `<p>A shipper just posted <strong>${escapeHtml(rfq.title)}</strong> (${modeLabel(
          rfq.mode
        )}, ${lane}).</p><p>Premium members quote first — early quotes win most jobs.</p>`,
        ctaLabel: "View & quote this RFQ",
        ctaPath: `/rfq/${rfq.id}`,
      }),
    }));

  await sendEmails(mails);
  return NextResponse.json({ ok: true, notified: mails.length });
}
