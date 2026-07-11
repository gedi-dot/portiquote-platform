import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Msg = {
  id: string;
  rfq_id: string | null;
  sender_id: string;
  recipient_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

type Conversation = {
  key: string;
  rfqId: string | null;
  otherId: string;
  last: Msg;
  unread: number;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Latest messages involving me — RLS already restricts to my conversations.
  const { data: raw } = await supabase
    .from("messages")
    .select("id, rfq_id, sender_id, recipient_id, body, is_read, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(300);
  const msgs = (raw ?? []) as Msg[];

  // Group into conversations by (RFQ, counterpart); newest message wins.
  const convMap = new Map<string, Conversation>();
  for (const m of msgs) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    const key = `${m.rfq_id ?? "direct"}|${otherId}`;
    const existing = convMap.get(key);
    const isUnreadIncoming = m.recipient_id === user.id && !m.is_read ? 1 : 0;
    if (!existing) {
      convMap.set(key, { key, rfqId: m.rfq_id, otherId, last: m, unread: isUnreadIncoming });
    } else {
      existing.unread += isUnreadIncoming;
    }
  }
  const convs = [...convMap.values()];

  // Resolve display names: prefer the counterpart's company, then their
  // profile name (via the public_profiles view), then a neutral fallback.
  const otherIds = [...new Set(convs.map((c) => c.otherId))];
  const rfqIds = [...new Set(convs.map((c) => c.rfqId).filter(Boolean))] as string[];

  const [{ data: companies }, { data: people }, { data: rfqs }] = await Promise.all([
    otherIds.length
      ? supabase
          .from("forwarder_companies")
          .select("owner_id, company_name")
          .in("owner_id", otherIds)
          .eq("is_published", true)
      : Promise.resolve({ data: [] as { owner_id: string; company_name: string }[] }),
    otherIds.length
      ? supabase.from("public_profiles").select("id, full_name").in("id", otherIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    rfqIds.length
      ? supabase.from("rfqs").select("id, reference, title").in("id", rfqIds)
      : Promise.resolve({ data: [] as { id: string; reference: string; title: string }[] }),
  ]);

  const companyName = new Map((companies ?? []).map((c) => [c.owner_id, c.company_name]));
  const personName = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const rfqInfo = new Map((rfqs ?? []).map((r) => [r.id, r]));

  const nameFor = (id: string) =>
    companyName.get(id) || personName.get(id) || "Marketplace member";

  const totalUnread = convs.reduce((n, c) => n + c.unread, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display font-bold text-3xl">Messages</h1>
            {totalUnread > 0 && (
              <span className="font-mono text-[11px] text-coral flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-coral" />
                {totalUnread} unread
              </span>
            )}
          </div>
          <p className="text-sm text-ink/60 mt-1.5">
            Conversations with shippers and forwarders, one thread per shipment.
          </p>

          <div className="mt-6 space-y-2">
            {convs.length === 0 && (
              <div className="bg-parchment border border-ink/10 rounded-xl p-6 text-center">
                <p className="font-display font-semibold">No messages yet</p>
                <p className="text-sm text-ink/60 mt-1">
                  Threads start on an RFQ — post a shipment or quote one, then message
                  the other side from its page.
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <Link href="/rfq/new" className="bg-saffron text-ink text-sm font-semibold rounded-lg px-4 py-2">
                    Post a shipment
                  </Link>
                  <Link href="/" className="border border-sea/25 text-sea text-sm font-medium rounded-lg px-4 py-2">
                    Browse forwarders
                  </Link>
                </div>
              </div>
            )}

            {convs.map((c) => {
              const rfq = c.rfqId ? rfqInfo.get(c.rfqId) : undefined;
              const mine = c.last.sender_id === user.id;
              const preview = `${mine ? "You: " : ""}${c.last.body}`;
              const inner = (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-[15px] truncate">
                        {nameFor(c.otherId)}
                      </p>
                      {c.unread > 0 && (
                        <span className="shrink-0 font-mono text-[10px] text-paper bg-coral rounded-full px-1.5 py-0.5">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-sea mt-0.5 truncate">
                      {rfq ? `${rfq.reference} · ${rfq.title}` : "Shipment thread"}
                    </p>
                    <p className={`text-sm mt-1 truncate ${c.unread > 0 ? "text-ink font-medium" : "text-ink/55"}`}>
                      {preview}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-ink/40 mt-1">
                    {formatDate(c.last.created_at)}
                  </span>
                </div>
              );
              return c.rfqId ? (
                <Link
                  key={c.key}
                  href={`/rfq/${c.rfqId}`}
                  className="block bg-paper border border-ink/10 hover:border-tide/50 transition rounded-xl px-4 py-3"
                >
                  {inner}
                </Link>
              ) : (
                <div key={c.key} className="bg-paper border border-ink/10 rounded-xl px-4 py-3">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
