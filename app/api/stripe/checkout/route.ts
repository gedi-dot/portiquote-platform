import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutSession, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Card payments aren't configured yet — use M-Pesa for now." },
      { status: 501 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { forwarderId } = await request.json().catch(() => ({}));
  if (!forwarderId) {
    return NextResponse.json({ error: "forwarderId required" }, { status: 400 });
  }

  const { data: fwd } = await supabase
    .from("forwarder_companies")
    .select("id, owner_id")
    .eq("id", forwarderId)
    .single();
  if (!fwd || fwd.owner_id !== user.id) {
    return NextResponse.json({ error: "Forwarder not found" }, { status: 403 });
  }

  const priceUsd = Number(process.env.PREMIUM_PRICE_USD ?? "20");
  const admin = createAdminClient();

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      profile_id: user.id,
      forwarder_id: forwarderId,
      provider: "stripe",
      purpose: "membership",
      amount: priceUsd,
      currency: "USD",
      status: "pending",
    })
    .select("id")
    .single();
  if (payErr || !payment) {
    return NextResponse.json({ error: "Could not create payment" }, { status: 500 });
  }

  try {
    const session = await createCheckoutSession({
      amountUsdCents: Math.round(priceUsd * 100),
      successUrl: `${SITE}/upgrade?card=success`,
      cancelUrl: `${SITE}/upgrade?card=cancelled`,
      customerEmail: user.email,
      metadata: {
        payment_id: payment.id,
        forwarder_id: forwarderId,
        profile_id: user.id,
      },
    });
    await admin
      .from("payments")
      .update({ provider_reference: session.id })
      .eq("id", payment.id);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    await admin
      .from("payments")
      .update({ status: "failed", failure_reason: (e as Error).message })
      .eq("id", payment.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
