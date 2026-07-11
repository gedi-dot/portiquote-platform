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

// A private thread on one RFQ between the current user and one counterpart.
// RLS already restricts reads to the participants; we filter to this pair.
export default function MessageThread({
  rfqId,
  otherUserId,
  otherName,
  meId,
  defaultOpen = false,
}: {
  rfqId: string;
  otherUserId: string;
  otherName: string;
  meId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || msgs !== null) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, created_at")
        .eq("rfq_id", rfqId)
        .order("created_at", { ascending: true });
      const pair = (data ?? []).filter(
        (m) =>
          (m.sender_id === meId && m.recipient_id === otherUserId) ||
          (m.sender_id === otherUserId && m.recipient_id === meId)
      );
      setMsgs(pair);
      // Mark incoming as read (best-effort).
      const unread = pair.filter((m) => m.recipient_id === meId);
      if (unread.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unread.map((m) => m.id));
      }
    })();
  }, [open, msgs, rfqId, meId, otherUserId]);

  // Live delivery: append messages that arrive while the thread is open.
  // (Requires the messages table in the realtime publication — migration 005.)
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`msgs-${rfqId}-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `rfq_id=eq.${rfqId}` },
        (payload) => {
          const m = payload.new as Msg;
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
  }, [open, rfqId, meId, otherUserId]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ rfq_id: rfqId, sender_id: meId, recipient_id: otherUserId, body })
      .select("id, sender_id, recipient_id, body, created_at")
      .single();
    setSending(false);
    if (err || !data) {
      setError("Could not send — please try again.");
      return;
    }
    setMsgs((m) => [...(m ?? []), data as Msg]);
    setDraft("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 font-mono text-[11px] text-sea hover:text-ink transition"
      >
        ✉ Message {otherName}
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-ink/10 pt-3">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mb-2">
        Messages with {otherName}
      </p>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {msgs === null && <p className="text-xs text-ink/45">Loading…</p>}
        {msgs !== null && msgs.length === 0 && (
          <p className="text-xs text-ink/45">No messages yet — start the conversation.</p>
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
