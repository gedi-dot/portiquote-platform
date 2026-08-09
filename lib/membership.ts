import type { SupabaseClient } from "@supabase/supabase-js";

// Grant (or extend) Premium. A payment while still active extends from the
// current period end, so renewing early never costs days. Clears the
// reminder flag so the next period gets its own renewal email.
export async function grantPremiumDays(
  admin: SupabaseClient,
  opts: {
    profileId: string;
    forwarderId: string | null;
    provider: "mpesa" | "stripe" | "paystack";
    days?: number;
  }
): Promise<{ periodEnd: string; isRenewal: boolean }> {
  const days = opts.days ?? 30;
  const now = new Date();

  let existing: { id: string; current_period_end: string | null } | null = null;
  if (opts.forwarderId) {
    const { data } = await admin
      .from("subscriptions")
      .select("id, current_period_end")
      .eq("forwarder_id", opts.forwarderId)
      .eq("status", "active")
      .order("current_period_end", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  const base =
    existing?.current_period_end && new Date(existing.current_period_end) > now
      ? new Date(existing.current_period_end)
      : now;
  const periodEnd = new Date(base.getTime() + days * 86_400_000).toISOString();

  if (existing) {
    await admin
      .from("subscriptions")
      .update({
        current_period_end: periodEnd,
        provider: opts.provider,
        tier: "premium",
        status: "active",
        reminder_sent_at: null,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("subscriptions").insert({
      profile_id: opts.profileId,
      forwarder_id: opts.forwarderId,
      provider: opts.provider,
      tier: "premium",
      status: "active",
      current_period_end: periodEnd,
    });
  }

  if (opts.forwarderId) {
    await admin
      .from("forwarder_companies")
      .update({ membership_tier: "premium" })
      .eq("id", opts.forwarderId);
  }
  return { periodEnd, isRenewal: Boolean(existing) };
}

// Sends the "you're Premium" confirmation after a successful payment. Kept
// separate from grantPremiumDays so that function stays a pure DB write —
// email is best-effort and must never make a real payment look like it
// failed if sending goes wrong.
//
// Called from the three payment webhooks (M-Pesa, Stripe, Paystack) rather
// than from client-triggered code: a webhook has no signed-in user, so this
// is the only point in the flow that reliably fires exactly once per payment.
export async function sendPremiumConfirmation(
  admin: import("@supabase/supabase-js").SupabaseClient,
  opts: {
    profileId: string;
    forwarderId: string | null;
    amount: number;
    currency: string;
    receipt: string | null;
    periodEnd: string;
    isRenewal: boolean;
  }
) {
  const { sendEmails, emailShell, escapeHtml } = await import("@/lib/email");

  const [{ data: owner }, fwdRes] = await Promise.all([
    admin.from("profiles").select("email, full_name").eq("id", opts.profileId).single(),
    opts.forwarderId
      ? admin
          .from("forwarder_companies")
          .select("company_name")
          .eq("id", opts.forwarderId)
          .single()
      : Promise.resolve({ data: null as { company_name: string } | null }),
  ]);
  if (!owner?.email) return;

  const companyName = fwdRes.data?.company_name ?? "your company";
  const until = new Date(opts.periodEnd).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const amount = `${opts.currency} ${Number(opts.amount).toLocaleString()}`;

  await sendEmails([
    {
      to: owner.email,
      subject: opts.isRenewal
        ? "Premium renewed — thank you"
        : "You're Premium — leads start now",
      html: emailShell({
        heading: opts.isRenewal ? "Premium renewed" : "Welcome to Premium 🎉",
        bodyHtml:
          `<p>Payment received: <strong>${amount}</strong>` +
          (opts.receipt ? ` (receipt ${escapeHtml(opts.receipt)})` : "") +
          `.</p>` +
          `<p><strong>${escapeHtml(companyName)}</strong> is Premium until <strong>${until}</strong>.</p>` +
          (opts.isRenewal
            ? `<p style="font-size:13px;color:#0B4A54;">No gap in cover — your new period started from the end of your last one.</p>`
            : `<p style="font-size:13px;color:#0B4A54;">You'll now be emailed the moment a shipment matches your lanes, ` +
              `and you can quote and message other Premium members on the platform.</p>`),
        ctaLabel: "Open your dashboard",
        ctaPath: "/dashboard",
      }),
    },
  ]);
}
