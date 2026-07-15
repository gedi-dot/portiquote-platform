"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState(false);

  async function act(action: "approve" | "reject") {
    setBusy(action);
    setError(false);
    const res = await fetch("/api/admin/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, action }),
    });
    setBusy(null);
    if (!res.ok) {
      setError(true);
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right shrink-0">
      <div className="flex gap-2">
        <button
          onClick={() => act("approve")}
          disabled={busy !== null}
          className="bg-tide text-paper text-xs font-semibold rounded-lg px-3.5 py-2 hover:brightness-95 disabled:opacity-50"
        >
          {busy === "approve" ? "…" : "✓ Approve"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={busy !== null}
          className="border border-ink/20 text-ink/60 text-xs font-semibold rounded-lg px-3.5 py-2 hover:border-coral hover:text-coral disabled:opacity-50"
        >
          {busy === "reject" ? "…" : "Reject"}
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-coral">Failed — try again</p>}
    </div>
  );
}
