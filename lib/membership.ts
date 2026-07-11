import type { SupabaseClient } from "@supabase/supabase-js";

// Grant (or extend) Premium. A payment while still active extends from the
// current period end, so renewing early never costs days. Clears the
// reminder flag so the next period gets its own renewal email.
export async function grantPremiumDays(
  admin: SupabaseClient,
  opts: {
    profileId: string;
    forwarderId: string | null;
    provider: "mpesa" | "stripe";
    days?: number;
  }
): Promise<string> {
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
  return periodEnd;
}
