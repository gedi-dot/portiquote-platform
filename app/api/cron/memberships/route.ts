import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml, type Mail } from "@/lib/email";

export const runtime = "nodejs";

// Daily membership housekeeping (vercel.json schedules this at 06:00 UTC):
//   1. Remind members whose period ends within 3 days (once per period).
//   2. Expire lapsed subscriptions and downgrade forwarders with none left.
// Protected by CRON_SECRET — Vercel Cron sends it as a Bearer token.

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run() {
  const admin = createAdminClient();
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 86_400_000);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ---- 1. Renewal reminders --------------------------------------------
  const { data: expiring } = await admin
    .from("subscriptions")
    .select("id, profile_id, forwarder_id, current_period_end")
    .eq("status", "active")
    .is("reminder_sent_at", null)
    .gt("current_period_end", now.toISOString())
    .lte("current_period_end", soon.toISOString());

  let reminders = 0;
  if (expiring && expiring.length > 0) {
    const fwdIds = [...new Set(expiring.map((s) => s.forwarder_id).filter(Boolean))] as string[];
    const profIds = [...new Set(expiring.map((s) => s.profile_id))];
    const [{ data: fwds }, { data: profs }] = await Promise.all([
      fwdIds.length
        ? admin.from("forwarder_companies").select("id, company_name").in("id", fwdIds)
        : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
      admin.from("profiles").select("id, email").in("id", profIds),
    ]);
    const fwdName = new Map((fwds ?? []).map((f) => [f.id, f.company_name]));
    const email = new Map((profs ?? []).map((p) => [p.id, p.email]));

    const mails: Mail[] = [];
    for (const sub of expiring) {
      const to = email.get(sub.profile_id);
      if (!to) continue;
      const name = sub.forwarder_id ? fwdName.get(sub.forwarder_id) : null;
      mails.push({
        to,
        subject: `Premium ends ${fmt(sub.current_period_end)} — renew to keep your leads`,
        html: emailShell({
          heading: "Your Premium period is ending",
          bodyHtml: `<p>${
            name ? `<strong>${escapeHtml(name)}</strong>` : "Your membership"
          } is Premium until <strong>${fmt(sub.current_period_end)}</strong>.</p><p>Memberships don't auto-charge — renew with M-Pesa or card and 30 days are added to the end of your current period, so renewing early never costs you a day.</p>`,
          ctaLabel: "Renew Premium",
          ctaPath: "/upgrade",
        }),
      });
    }
    await sendEmails(mails);
    await admin
      .from("subscriptions")
      .update({ reminder_sent_at: now.toISOString() })
      .in("id", expiring.map((s) => s.id));
    reminders = mails.length;
  }

  // ---- 2. Expire lapsed memberships -------------------------------------
  const { data: lapsed } = await admin
    .from("subscriptions")
    .select("id, profile_id, forwarder_id, current_period_end")
    .eq("status", "active")
    .lt("current_period_end", now.toISOString());

  let downgraded = 0;
  if (lapsed && lapsed.length > 0) {
    await admin
      .from("subscriptions")
      .update({ status: "expired" })
      .in("id", lapsed.map((s) => s.id));

    const fwdIds = [...new Set(lapsed.map((s) => s.forwarder_id).filter(Boolean))] as string[];
    for (const fwdId of fwdIds) {
      // Any other still-active coverage? (e.g. they renewed on another row)
      const { data: stillActive } = await admin
        .from("subscriptions")
        .select("id")
        .eq("forwarder_id", fwdId)
        .eq("status", "active")
        .gt("current_period_end", now.toISOString())
        .limit(1);
      if (stillActive && stillActive.length > 0) continue;

      const { data: fwd } = await admin
        .from("forwarder_companies")
        .select("id, company_name, owner_id, membership_tier")
        .eq("id", fwdId)
        .single();
      if (!fwd || fwd.membership_tier !== "premium") continue;

      await admin
        .from("forwarder_companies")
        .update({ membership_tier: "free" })
        .eq("id", fwdId);
      downgraded++;

      const { data: owner } = await admin
        .from("profiles")
        .select("email")
        .eq("id", fwd.owner_id)
        .single();
      if (owner?.email) {
        await sendEmails([
          {
            to: owner.email,
            subject: "Your Premium membership has ended",
            html: emailShell({
              heading: "Premium has ended — leads are paused",
              bodyHtml: `<p><strong>${escapeHtml(
                fwd.company_name
              )}</strong> is back on the free tier. Your listing stays in the directory, but new RFQ leads and quoting are paused until you renew.</p>`,
              ctaLabel: "Renew Premium",
              ctaPath: "/upgrade",
            }),
          },
        ]);
      }
    }
  }

  return { reminders, expired: lapsed?.length ?? 0, downgraded };
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await run());
}

export async function POST(request: Request) {
  return GET(request);
}
