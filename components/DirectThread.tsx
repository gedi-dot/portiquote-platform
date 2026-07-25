"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

// A full direct-message thread between the current user and one other person
// (rfq_id = null). Used on /messages/[userId]. RLS restricts reads and writes
// to the two participants. Anyone in a conversation can reply here — which is
// the whole point: the inbox previously had nowhere to reply to a DM.
export default function DirectThread({
  meId,
  otherUserId,
  otherName,
  canMessage,
}: {
  meId: string;
  otherUserId: string;
  otherName: string;
  canMessage: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollDown = () =>
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));

  // Load the thread and mark incoming messages read.
  useEffect(() => {
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
      scrollDown();
      const unread = pair.filter((m) => m.recipient_id === meId);
      if (unread.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unread.map((m) => m.id));
      }
    })();
  }, [meId, otherUserId]);

  // Live delivery.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread-${meId}-${otherUserId}`)
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
          scrollDown();
          if (m.recipient_id === meId) {
            void supabase.from("messages").update({ is_read: true }).eq("id", m.id);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meId, otherUserId]);

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
    scrollDown();
    void fetch("/api/notify/message-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: (data as Msg).id }),
    }).catch(() => {});
  }

  return (
    <div className="bg-paper border border-ink/10 rounded-xl flex flex-col h-[65vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs === null && <p className="text-sm text-ink/45">Loading…</p>}
        {msgs !== null && msgs.length === 0 && (
          <p className="text-sm text-ink/45 text-center mt-8">
            No messages yet. Say hello to {otherName}.
          </p>
        )}
        {(msgs ?? []).map((m) => (
          <div key={m.id} className={m.sender_id === meId ? "text-right" : "text-left"}>
            <span
              className={`inline-block rounded-2xl px-3.5 py-2 text-sm max-w-[80%] text-left ${
                m.sender_id === meId ? "bg-sea text-paper" : "bg-mist text-ink"
              }`}
            >
              {m.body}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {canMessage ? (
        <div className="border-t border-ink/10 p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Message ${otherName}…`}
              className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-5 disabled:opacity-50"
            >
              Send
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-coral">{error}</p>}
        </div>
      ) : (
        <div className="border-t border-ink/10 p-4 text-center bg-parchment">
          <p className="text-sm text-ink/70">
            Messaging is a Premium feature. Upgrade to reply to {otherName} and
            message any forwarder on the platform.
          </p>
          <Link
            href="/upgrade"
            className="inline-block mt-2.5 bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-5 py-2"
          >
            Go Premium to reply
          </Link>
        </div>
      )}
    </div>
  );
}
