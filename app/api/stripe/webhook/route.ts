import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStripeSignature } from "@/lib/stripe";
import { grantPremiumDays, sendPremiumConfirmation } from "@/lib/membership";

export const runtime = "nodejs";

// Stripe posts events here. Configure the endpoint in the Stripe dashboard
// with the "checkout.session.completed" event and set STRIPE_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    type: string;
    data: {
      object: {
        id: string;
        payment_intent?: string | null;
        metadata?: Record<string, string>;
      };
    };
  };

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const paymentId = session.metadata?.payment_id;
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
      stripe_payment_intent: session.payment_intent ?? null,
      provider_reference: session.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  const { periodEnd, isRenewal } = await grantPremiumDays(admin, {
    profileId: payment.profile_id,
    forwarderId: payment.forwarder_id,
    provider: "stripe",
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
    console.error("[stripe/webhook] confirmation email failed:", (e as Error).message);
  }

  return NextResponse.json({ received: true });
}
