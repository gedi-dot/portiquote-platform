import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";
import { countryCode, modeLabel } from "@/lib/format";

export const runtime = "nodejs";

// New RFQ -> alert forwarders whose lanes match the corridor.
//
// Direct-contact ("FreightNet") model:
//   Premium members receive the shipper's contact details and quote by
//   contacting them directly, off-platform.
//   Free claimed members are told a matching shipment exists, but must
//   upgrade to see who posted it.
//   Unclaimed listings have no owner to email — claiming is what turns a
//   directory entry into a lead channel.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { rfqId } = await request.json().catch(() => ({}));
  if (!rfqId) return NextResponse.json({ error: "rfqId required" }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[rfq-created] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json(
      { error: "Server not configured for notifications" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { data: rfq, error: rfqErr } = await admin
    .from("rfqs")
    .select(
      `id, shipper_id, reference, title, mode, origin_country, origin_city,
       destination_country, destination_city, incoterm, container_type,
       container_count, weight_kg, volume_cbm, ready_date, cargo_description`
    )
    .eq("id", rfqId)
    .single();
  if (rfqErr) {
    console.error("[rfq-created] rfq lookup failed:", rfqErr.message);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  // Only the shipper who posted it can trigger its notifications.
  if (!rfq || rfq.shipper_id !== user.id) {
    console.error("[rfq-created] not owner or missing", {
      found: Boolean(rfq),
      shipper: rfq?.shipper_id,
      user: user.id,
    });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The shipper's own contact details — shared with Premium members so they
  // can quote directly. Disclosed on the RFQ form before posting.
  const { data: shipper } = await admin
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", rfq.shipper_id)
    .single();

  // Forwarders serving this corridor…
  const { data: lanes } = await admin
    .from("forwarder_lanes")
    .select("forwarder_id")
    .eq("origin_country", rfq.origin_country)
    .eq("destination_country", rfq.destination_country);
  const laneFwdIds = [...new Set((lanes ?? []).map((l) => l.forwarder_id))];
  if (laneFwdIds.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  // …that are published and CLAIMED (an owner exists to receive the alert).
  const { data: fwds } = await admin
    .from("forwarder_companies")
    .select("id, owner_id, membership_tier")
    .in("id", laneFwdIds)
    .eq("is_published", true)
    .not("owner_id", "is", null);

  const premiumOwners = [
    ...new Set(
      (fwds ?? []).filter((f) => f.membership_tier === "premium").map((f) => f.owner_id)
    ),
  ];
  const freeOwners = [
    ...new Set(
      (fwds ?? []).filter((f) => f.membership_tier !== "premium").map((f) => f.owner_id)
    ),
  ].filter((id) => !premiumOwners.includes(id));

  const allOwners = [...premiumOwners, ...freeOwners];
  if (allOwners.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  const { data: owners } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", allOwners);

  const lane = `${countryCode(rfq.origin_country)} → ${countryCode(rfq.destination_country)}`;
  const origin = [rfq.origin_city, rfq.origin_country].filter(Boolean).join(", ");
  const destination = [rfq.destination_city, rfq.destination_country]
    .filter(Boolean)
    .join(", ");

  const load = rfq.container_type
    ? `${rfq.container_count ?? 1} × ${rfq.container_type}`
    : rfq.weight_kg
    ? `${rfq.weight_kg} kg`
    : rfq.volume_cbm
    ? `${rfq.volume_cbm} cbm`
    : null;

  // Shared shipment summary table.
  const row = (label: string, value: string) =>
    `<tr><td style="padding:5px 0;color:#0B4A54;font-size:13px;">${label}</td>` +
    `<td style="padding:5px 0;text-align:right;font-size:13px;color:#062A2E;font-weight:600;">${escapeHtml(
      value
    )}</td></tr>`;

  const details =
    `<table style="width:100%;border-collapse:collapse;margin:16px 0;">` +
    row("Route", `${origin} → ${destination}`) +
    row("Mode", modeLabel(rfq.mode)) +
    (load ? row("Load", load) : "") +
    (rfq.incoterm ? row("Incoterm", rfq.incoterm) : "") +
    (rfq.ready_date ? row("Cargo ready", rfq.ready_date) : "") +
    `</table>`;

  const cargo = rfq.cargo_description
    ? `<p style="font-size:14px;color:#062A2E;">${escapeHtml(rfq.cargo_description)}</p>`
    : "";

  const mails: { to: string; subject: string; html: string }[] = [];

  for (const o of owners ?? []) {
    if (!o.email) continue;
    const isPremium = premiumOwners.includes(o.id);

    if (isPremium) {
      // Full lead: shipment details + how to reach the shipper.
      const contactRows =
        `<table style="width:100%;border-collapse:collapse;">` +
        (shipper?.full_name ? row("Contact", shipper.full_name) : "") +
        (shipper?.email ? row("Email", shipper.email) : "") +
        (shipper?.phone ? row("Phone", shipper.phone) : "") +
        `</table>`;

      mails.push({
        to: o.email,
        subject: `New shipment on your lane · ${lane} · ${rfq.reference}`,
        html: emailShell({
          heading: "New shipment on your lane",
          bodyHtml:
            `<p style="font-size:15px;color:#062A2E;"><strong>${escapeHtml(
              rfq.title
            )}</strong></p>` +
            details +
            cargo +
            `<div style="background:#F5EFE1;border-radius:10px;padding:14px 16px;margin-top:18px;">
               <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0B4A54;">Contact the shipper directly</p>
               ${contactRows}
             </div>
             <p style="font-size:13px;color:#0B4A54;margin-top:16px;">Quote them directly by email or phone. Early replies win most jobs.</p>`,
          ctaLabel: "View full shipment details",
          ctaPath: `/rfq/${rfq.id}`,
        }),
      });
    } else {
      // Teaser: they know a job exists on their lane, not who posted it.
      mails.push({
        to: o.email,
        subject: `A shipment matched your lane · ${lane}`,
        html: emailShell({
          heading: "A shipment matched your lane",
          bodyHtml:
            `<p style="font-size:15px;color:#062A2E;"><strong>${escapeHtml(
              rfq.title
            )}</strong></p>` +
            details +
            `<p style="font-size:14px;color:#062A2E;">Premium members receive the shipper's contact details and quote directly. Upgrade to see who posted this and reach them today.</p>`,
          ctaLabel: "Go Premium",
          ctaPath: `/upgrade`,
        }),
      });
    }
  }

  console.log(
    `[rfq-created] ${rfq.reference}: ${mails.length} alert(s) — ` +
      `${premiumOwners.length} premium, ${freeOwners.length} free`
  );
  await sendEmails(mails);
  return NextResponse.json({
    ok: true,
    notified: mails.length,
    premium: premiumOwners.length,
    free: freeOwners.length,
  });
}
