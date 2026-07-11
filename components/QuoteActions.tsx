"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function QuoteActions({
  quoteId,
  rfqId,
}: {
  quoteId: string;
  rfqId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const a = await supabase.from("quotes").update({ status: "accepted" }).eq("id", quoteId);
    if (a.error) {
      setBusy(false);
      setError("Could not accept the quote.");
      return;
    }
    await supabase
      .from("quotes")
      .update({ status: "rejected" })
      .eq("rfq_id", rfqId)
      .neq("id", quoteId)
      .eq("status", "submitted");
    await supabase.from("rfqs").update({ status: "awarded" }).eq("id", rfqId);
    // Fire-and-forget: email the winning forwarder.
    fetch("/api/notify/quote-accepted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId }),
      keepalive: true,
    }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        onClick={accept}
        disabled={busy}
        className="bg-saffron hover:brightness-95 transition text-ink text-xs font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
      >
        {busy ? "Accepting…" : "Accept"}
      </button>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
