import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantPremiumDays, sendPremiumConfirmation } from "@/lib/membership";

export const runtime = "nodejs";

// Safaricom POSTs the STK Push result here. This URL must be publicly reachable
// (set MPESA_CALLBACK_URL to its public address). Always acknowledge so Daraja
// stops retrying.
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const cb = payload?.Body?.stkCallback;
  if (!cb) return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" });

  const admin = createAdminClient();
  const checkoutRequestId: string = cb.CheckoutRequestID;
  const resultCode: number = cb.ResultCode;

  const { data: payment } = await admin
    .from("payments")
    .select("id, forwarder_id, profile_id, status")
    .eq("checkout_request_id", checkoutRequestId)
    .single();
  if (!payment) return NextResponse.json({ ResultCode: 0, ResultDesc: "No match" });
  if (payment.status !== "pending") {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Already handled" });
  }

  if (resultCode === 0) {
    const items: Array<{ Name: string; Value?: string | number }> =
      cb.CallbackMetadata?.Item ?? [];
    const receipt = String(
      items.find((i) => i.Name === "MpesaReceiptNumber")?.Value ?? ""
    );

    await admin
      .from("payments")
      .update({
        status: "success",
        mpesa_receipt: receipt,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Grant Premium — extends from the current period end if still active.
    const { periodEnd, isRenewal } = await grantPremiumDays(admin, {
      profileId: payment.profile_id,
      forwarderId: payment.forwarder_id,
      provider: "mpesa",
    });

    // Best-effort: the payment has already succeeded and Premium is already
    // granted above, so a broken send here must never turn into an error
    // response — Safaricom would read that as failure and retry the callback.
    try {
      await sendPremiumConfirmation(admin, {
        profileId: payment.profile_id,
        forwarderId: payment.forwarder_id,
        amount: 2500,
        currency: "KES",
        receipt,
        periodEnd,
        isRenewal,
      });
    } catch (e) {
      console.error("[mpesa/callback] confirmation email failed:", (e as Error).message);
    }
  } else {
    await admin
      .from("payments")
      .update({ status: "failed", failure_reason: cb.ResultDesc ?? "Cancelled" })
      .eq("id", payment.id);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
