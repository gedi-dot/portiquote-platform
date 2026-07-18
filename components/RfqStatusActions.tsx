"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Lets the shipper who posted an RFQ close it when the cargo is handled, and
// reopen it if they close it by mistake. Closing matters in the direct-contact
// model: forwarders have the shipper's phone number, so a forgotten open RFQ
// keeps generating calls about cargo that already shipped.
export default function RfqStatusActions({
  rfqId,
  status,
}: {
  rfqId: string;
  status: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Awarded RFQs are settled — nothing to close or reopen.
  if (status === "awarded") return null;

  async function setStatus(next: "closed" | "open") {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("rfqs")
      .update({ status: next })
      .eq("id", rfqId);
    setBusy(false);
    if (err) {
      setError("Could not update — please try again.");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (status === "closed") {
    return (
      <div className="mt-4 rounded-xl border border-ink/10 bg-paper px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/70">
          This shipment is closed — forwarders can no longer quote on it.
        </p>
        <button
          onClick={() => setStatus("open")}
          disabled={busy}
          className="text-sm font-semibold text-sea hover:text-ink transition disabled:opacity-50"
        >
          {busy ? "Reopening…" : "Reopen"}
        </button>
      </div>
    );
  }

  if (status !== "open") return null;

  return (
    <div className="mt-4 rounded-xl border border-ink/10 bg-paper px-4 py-3">
      {!confirming ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/60">
            Sorted this shipment elsewhere? Close it so forwarders stop
            contacting you about it.
          </p>
          <button
            onClick={() => setConfirming(true)}
            className="shrink-0 text-sm font-semibold border border-ink/20 rounded-lg px-4 py-2 hover:bg-mist transition"
          >
            Close this RFQ
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink">
            Close this RFQ? Forwarders won&apos;t be able to quote. You can
            reopen it later.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="text-sm text-ink/60 hover:text-ink px-3 py-2"
            >
              Cancel
            </button>
            <button
              onClick={() => setStatus("closed")}
              disabled={busy}
              className="text-sm font-semibold bg-sea hover:bg-ink transition text-paper rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {busy ? "Closing…" : "Yes, close it"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}
