import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackSignature, verifyTransaction } from "@/lib/paystack";
import { grantPremiumDays, sendPremiumConfirmation } from "@/lib/membership";

export const runtime = "nodejs";

// Paystack posts events here. Set the webhook URL in the Paystack dashboard to
// {SITE}/api/paystack/webhook. Paystack signs with your SECRET key (HMAC-SHA512).
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const raw = await request.text();
  if (!verifyPaystackSignature(raw, request.headers.get("x-paystack-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    data: { reference?: string; metadata?: Record<string, string> };
  };

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;
  if (!reference) return NextResponse.json({ received: true });

  // Never trust the webhook body alone — verify server-to-server before granting.
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch {
    return NextResponse.json({ received: true }); // will retry
  }
  if (verified.status !== "success") {
    return NextResponse.json({ received: true });
  }

  const paymentId = verified.metadata?.payment_id;
  if (!paymentId) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, profile_id, forwarder_id, status, amount, currency")
    .eq("id", paymentId)
    .single();
  if (!payment || payment.status !== "pending") {
    return NextResponse.json({ received: true }); // unknown or already handled
  }

  await admin
    .from("payments")
    .update({
      status: "success",
      paystack_reference: reference,
      provider_reference: reference,
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  const { periodEnd, isRenewal } = await grantPremiumDays(admin, {
    profileId: payment.profile_id,
    forwarderId: payment.forwarder_id,
    provider: "paystack",
  });

  // Best-effort: Premium is already granted above, so an email failure here
  // must never turn a successful payment into an error response.
  try {
    await sendPremiumConfirmation(admin, {
      profileId: payment.profile_id,
      forwarderId: payment.forwarder_id,
      amount: payment.amount,
      currency: payment.currency,
      receipt: null,
      periodEnd,
      isRenewal,
    });
  } catch (e) {
    console.error("[paystack/webhook] confirmation email failed:", (e as Error).message);
  }

  return NextResponse.json({ received: true });
}
