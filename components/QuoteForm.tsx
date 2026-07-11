"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function QuoteForm({
  rfqId,
  forwarderId,
}: {
  rfqId: string;
  forwarderId: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [transitDays, setTransitDays] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!amount) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("quotes").insert({
      rfq_id: rfqId,
      forwarder_id: forwarderId,
      amount: Number(amount),
      currency,
      transit_time_days: transitDays ? Number(transitDays) : null,
      valid_until: validUntil || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (err) {
      if (err.code === "23505") setError("You've already quoted this RFQ.");
      else if (err.message.toLowerCase().includes("row-level security"))
        setError("Premium membership is required to submit quotes.");
      else setError(err.message);
      return;
    }
    // Fire-and-forget: email the shipper that a quote arrived.
    fetch("/api/notify/quote-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfqId, forwarderId }),
      keepalive: true,
    }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="bg-paper border border-ink/10 rounded-xl p-4">
      <p className="font-display font-semibold text-base">Submit your quote</p>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Total price *</span>
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" placeholder="3200" />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide">
            <option>USD</option><option>KES</option><option>EUR</option><option>GBP</option>
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Transit (days)</span>
          <input type="number" min={0} value={transitDays} onChange={(e) => setTransitDays(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" placeholder="28" />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Valid until</span>
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" />
        </label>
      </div>
      <label className="block mt-3">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" placeholder="Includes THC and B/L fees. Subject to space and equipment." />
      </label>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <button
        onClick={submit}
        disabled={saving || !amount}
        className="mt-3 w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit quote"}
      </button>
    </div>
  );
}
