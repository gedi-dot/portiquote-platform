import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";

export const runtime = "nodejs";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
  if (!paystackConfigured()) {
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
  if (!user.email) {
    return NextResponse.json({ error: "Your account has no email" }, { status: 400 });
  }

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

  // International card price in USD. Paystack wants the amount in cents.
  const priceUsd = Number(process.env.PREMIUM_PRICE_USD ?? "20");
  const admin = createAdminClient();

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      profile_id: user.id,
      forwarder_id: forwarderId,
      provider: "paystack",
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

  // Our payment row id doubles as the Paystack reference — unique and traceable.
  const reference = `nkg_${payment.id}`;

  try {
    const tx = await initializeTransaction({
      amountSubunit: Math.round(priceUsd * 100),
      currency: "USD",
      email: user.email,
      callbackUrl: `${SITE}/upgrade?card=success`,
      reference,
      metadata: {
        payment_id: payment.id,
        forwarder_id: forwarderId,
        profile_id: user.id,
      },
    });
    await admin
      .from("payments")
      .update({ provider_reference: reference, paystack_reference: reference })
      .eq("id", payment.id);
    return NextResponse.json({ url: tx.authorization_url });
  } catch (e) {
    await admin
      .from("payments")
      .update({ status: "failed", failure_reason: (e as Error).message })
      .eq("id", payment.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
