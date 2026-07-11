"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyToggle({
  forwarderId,
  verified,
}: {
  forwarderId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setBusy(true);
    setError(false);
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forwarderId, verified: !verified }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right shrink-0">
      <button
        onClick={toggle}
        disabled={busy}
        className={`text-xs font-semibold rounded-lg px-3.5 py-2 transition disabled:opacity-50 ${
          verified
            ? "border border-ink/20 text-ink/60 hover:border-coral hover:text-coral"
            : "bg-tide text-paper hover:brightness-95"
        }`}
      >
        {busy ? "…" : verified ? "Remove badge" : "✓ Verify"}
      </button>
      {error && <p className="mt-1 text-[11px] text-coral">Failed — try again</p>}
    </div>
  );
}
