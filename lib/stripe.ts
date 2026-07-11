import { createHmac, timingSafeEqual } from "crypto";

// Stripe via plain REST — mirrors the dependency-free Resend/Daraja approach.

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function form(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export async function createCheckoutSession(opts: {
  amountUsdCents: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  metadata: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const fields: Record<string, string> = {
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(opts.amountUsdCents),
    "line_items[0][price_data][product_data][name]":
      "N.K. Gedi & Co. — Premium membership (30 days)",
  };
  if (opts.customerEmail) fields["customer_email"] = opts.customerEmail;
  for (const [k, v] of Object.entries(opts.metadata)) {
    fields[`metadata[${k}]`] = v;
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
    body: form(fields),
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data?.error?.message ?? "Could not create Stripe session");
  }
  return { id: data.id as string, url: data.url as string };
}

// Verify Stripe's webhook signature: HMAC-SHA256 of "<t>.<rawBody>" with the
// endpoint secret must match one of the v1 signatures, within 5 minutes.
export function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string
): boolean {
  if (!sigHeader) return false;
  const parts = new Map<string, string[]>();
  for (const piece of sigHeader.split(",")) {
    const [k, v] = piece.split("=", 2);
    if (!k || !v) continue;
    parts.set(k, [...(parts.get(k) ?? []), v]);
  }
  const t = parts.get("t")?.[0];
  const sigs = parts.get("v1") ?? [];
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${t}.${rawBody}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return sigs.some((s) => {
    const buf = Buffer.from(s, "utf8");
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}
