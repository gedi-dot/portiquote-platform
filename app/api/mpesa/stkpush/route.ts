import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateSTKPush, normalizePhone } from "@/lib/mpesa";

export const runtime = "nodejs";

// Monthly Premium membership price (KES). Move to config/DB when you have tiers.
const PREMIUM_PRICE_KES = 2500;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const phone: string | undefined = body?.phone;
  const forwarderId: string | undefined = body?.forwarderId;
  if (!phone || !forwarderId) {
    return NextResponse.json(
      { error: "phone and forwarderId are required" },
      { status: 400 }
    );
  }

  // The signed-in user must own the forwarder being upgraded.
  const { data: fwd } = await supabase
    .from("forwarder_companies")
    .select("id, owner_id")
    .eq("id", forwarderId)
    .single();
  if (!fwd || fwd.owner_id !== user.id) {
    return NextResponse.json({ error: "Forwarder not found" }, { status: 403 });
  }

  const admin = createAdminClient();

  // 1. Record a pending payment (service role bypasses RLS).
  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      profile_id: user.id,
      forwarder_id: forwarderId,
      provider: "mpesa",
      purpose: "membership",
      amount: PREMIUM_PRICE_KES,
      currency: "KES",
      status: "pending",
      phone: normalizePhone(phone),
      account_reference: "FREIGHTPAIR",
    })
    .select("id")
    .single();
  if (payErr || !payment) {
    return NextResponse.json({ error: "Could not create payment" }, { status: 500 });
  }

  // 2. Ask Safaricom to prompt the customer's phone.
  try {
    const stk = await initiateSTKPush({
      phone,
      amount: PREMIUM_PRICE_KES,
      accountReference: "FREIGHTPAIR",
      description: "Premium",
    });
    await admin
      .from("payments")
      .update({
        merchant_request_id: stk.MerchantRequestID,
        checkout_request_id: stk.CheckoutRequestID,
      })
      .eq("id", payment.id);

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      message: stk.CustomerMessage,
    });
  } catch (e) {
    await admin
      .from("payments")
      .update({ status: "failed", failure_reason: (e as Error).message })
      .eq("id", payment.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
