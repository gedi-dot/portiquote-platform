import { createHmac, timingSafeEqual } from "crypto";

// Paystack via plain REST — same dependency-free pattern as Daraja/Resend/Stripe.
// Paystack works across Kenya, Nigeria, Ghana, South Africa, Egypt, Côte d'Ivoire
// and accepts international Visa/Mastercard, so it's the global + pan-African rail.

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

// Paystack amounts are in the SUBUNIT of the currency (kobo, cents, etc.).
export async function initializeTransaction(opts: {
  amountSubunit: number;
  currency: string; // e.g. "USD", "KES", "NGN", "GHS", "ZAR"
  email: string;
  callbackUrl: string;
  reference: string;
  metadata: Record<string, string>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountSubunit,
      currency: opts.currency,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data?.message ?? "Could not initialize Paystack transaction");
  }
  return data.data;
}

// Server-to-server verification — the source of truth before granting anything.
export async function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number; currency: string; metadata: Record<string, string> }> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    }
  );
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data?.message ?? "Could not verify Paystack transaction");
  }
  return {
    status: data.data.status, // "success" when paid
    amount: data.data.amount,
    currency: data.data.currency,
    metadata: data.data.metadata ?? {},
  };
}

// Paystack signs webhooks with HMAC-SHA512 of the raw body using your SECRET key.
export function verifyPaystackSignature(
  rawBody: string,
  sigHeader: string | null,
  secretKey: string
): boolean {
  if (!sigHeader) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sigHeader, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
