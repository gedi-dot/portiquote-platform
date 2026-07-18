"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

// A direct (RFQ-less) message thread between two forwarders. Uses the same
// messages table with rfq_id = null. RLS already restricts reads/writes to the
// two participants. Rendered on a forwarder profile, shown only to other
// signed-in forwarders (the parent decides whether to render it).
export default function ForwarderMessage({
  meId,
  otherUserId,
  otherName,
}: {
  meId: string;
  otherUserId: string;
  otherName: string;
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the direct thread (rfq_id null) between this pair.
  useEffect(() => {
    if (!open || msgs !== null) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, created_at, rfq_id")
        .is("rfq_id", null)
        .order("created_at", { ascending: true });
      const pair = (data ?? []).filter(
        (m) =>
          (m.sender_id === meId && m.recipient_id === otherUserId) ||
          (m.sender_id === otherUserId && m.recipient_id === meId)
      ) as Msg[];
      setMsgs(pair);
      const unread = pair.filter((m) => m.recipient_id === meId);
      if (unread.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unread.map((m) => m.id));
      }
    })();
  }, [open, msgs, meId, otherUserId]);

  // Live delivery while the thread is open.
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dm-${meId}-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg & { rfq_id: string | null };
          if (m.rfq_id !== null) return;
          const inPair =
            (m.sender_id === meId && m.recipient_id === otherUserId) ||
            (m.sender_id === otherUserId && m.recipient_id === meId);
          if (!inPair) return;
          setMsgs((prev) =>
            prev && prev.some((x) => x.id === m.id) ? prev : [...(prev ?? []), m]
          );
          if (m.recipient_id === meId) {
            void supabase.from("messages").update({ is_read: true }).eq("id", m.id);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, meId, otherUserId]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ rfq_id: null, sender_id: meId, recipient_id: otherUserId, body })
      .select("id, sender_id, recipient_id, body, created_at")
      .single();
    setSending(false);
    if (err || !data) {
      setError("Could not send — please try again.");
      return;
    }
    setMsgs((m) => [...(m ?? []), data as Msg]);
    setDraft("");

    // Fire a quiet DM notification email (best-effort, non-blocking).
    void fetch("/api/notify/message-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: (data as Msg).id }),
    }).catch(() => {});
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-2 border border-sea/30 text-sea font-semibold text-sm rounded-lg py-2.5 hover:bg-mist transition"
      >
        ✉ Message {otherName}
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-ink/10 pt-3">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mb-2">
        Direct message · {otherName}
      </p>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {msgs === null && <p className="text-xs text-ink/45">Loading…</p>}
        {msgs !== null && msgs.length === 0 && (
          <p className="text-xs text-ink/45">
            No messages yet — introduce your company and the lanes you cover.
          </p>
        )}
        {(msgs ?? []).map((m) => (
          <div key={m.id} className={m.sender_id === meId ? "text-right" : "text-left"}>
            <span
              className={`inline-block rounded-lg px-3 py-1.5 text-sm max-w-[85%] text-left ${
                m.sender_id === meId ? "bg-sea text-paper" : "bg-mist text-ink"
              }`}
            >
              {m.body}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a message…"
          className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-tide"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-4 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-coral">{error}</p>}
    </div>
  );
}
