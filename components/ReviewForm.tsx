"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({ forwarderId }: { forwarderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (rating < 1) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { error: err } = await supabase.from("reviews").insert({
      forwarder_id: forwarderId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
      reviewer_name: profile?.full_name ?? "Shipper",
    });
    setSaving(false);
    if (err) {
      if (err.code === "23505") setError("You've already reviewed this forwarder.");
      else setError("Could not post the review. You can't review your own listing.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <p className="text-sm text-ink/60 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-tide inline-block" />
        Thanks — your review is live.
      </p>
    );
  }

  return (
    <div className="bg-mist rounded-xl p-4">
      <p className="font-display font-semibold text-sm">Leave a review</p>
      <div className="flex gap-1 mt-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl leading-none ${n <= rating ? "text-saffron" : "text-ink/20"}`}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="How was the shipment handled?"
        className="mt-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-tide"
      />
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <button
        onClick={submit}
        disabled={saving || rating < 1}
        className="mt-2 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
      >
        {saving ? "Posting…" : "Post review"}
      </button>
    </div>
  );
}
