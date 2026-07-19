// Approximate currency display for international members.
//
// The platform CHARGES in KES only — the member's own bank converts at their
// card's rate. This helper exists purely so a forwarder in Dubai or Guangzhou
// can read "KES 2,500" and instantly know roughly what it costs them.
//
// Rates come from the free open.er-api.com endpoint (no key), cached for a
// day via Next's fetch cache, so displayed figures drift with the market
// without any manual updates. If the rate service is unreachable, we return
// null and the pages simply omit the line — the real price never depends on it.

const RATES_URL = "https://open.er-api.com/v6/latest/KES";

type Rates = { USD?: number; EUR?: number; AED?: number; CNY?: number };

async function getRates(): Promise<Rates | null> {
  try {
    const res = await fetch(RATES_URL, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) return null;
    return data.rates as Rates;
  } catch {
    return null;
  }
}

// "≈ $19 · €18 · AED 71 · ¥139" for a KES amount, or null if rates are down.
export async function kesApproxLine(amountKes: number): Promise<string | null> {
  const r = await getRates();
  if (!r) return null;
  const parts: string[] = [];
  if (r.USD) parts.push(`$${Math.round(amountKes * r.USD)}`);
  if (r.EUR) parts.push(`€${Math.round(amountKes * r.EUR)}`);
  if (r.AED) parts.push(`AED ${Math.round(amountKes * r.AED)}`);
  if (r.CNY) parts.push(`¥${Math.round(amountKes * r.CNY)}`);
  return parts.length > 0 ? `≈ ${parts.join(" · ")}` : null;
}
