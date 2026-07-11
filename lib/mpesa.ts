// Safaricom Daraja (M-Pesa) — Lipa na M-Pesa Online (STK Push) helper.
// Docs: https://developer.safaricom.co.ke

const BASE =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

// Accepts 07XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX -> 2547XXXXXXXX
export function normalizePhone(input: string): string {
  let p = input.replace(/\D/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  else if (p.length === 9 && p.startsWith("7")) p = "254" + p;
  return p;
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status})`);
  const data = await res.json();
  return data.access_token as string;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

export type STKPushResult = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export async function initiateSTKPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  description?: string;
}): Promise<STKPushResult> {
  const token = await getAccessToken();
  const ts = timestamp();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${ts}`
  ).toString("base64");
  const phone = normalizePhone(params.phone);

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL!,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: (params.description ?? "Membership").slice(0, 13),
    }),
  });

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(
      data.errorMessage || data.ResponseDescription || "STK push failed"
    );
  }
  return data as STKPushResult;
}
