import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { countryCode, modeLabel, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type RfqRow = {
  id: string;
  reference: string;
  title: string;
  status: string;
  mode: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  ready_date: string | null;
  created_at: string;
  quotes: { count: number }[];
};

type LeadRow = {
  id: string;
  reference: string;
  mode: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  incoterm: string | null;
  ready_date: string | null;
  created_at: string;
};

type MyQuoteRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  rfq_id: string;
  rfqs: { reference: string; title: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  open: "text-tide",
  awarded: "text-saffron",
  submitted: "text-tide",
  accepted: "text-tide",
  rejected: "text-ink/40",
  withdrawn: "text-ink/40",
  closed: "text-ink/40",
  expired: "text-ink/40",
  cancelled: "text-coral",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // ---- My shipments (as a shipper) ----
  const { data: rfqData } = await supabase
    .from("rfqs")
    .select(
      `id, reference, title, status, mode, origin_country, origin_city,
       destination_country, destination_city, ready_date, created_at,
       quotes ( count )`
    )
    .eq("shipper_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const myRfqs = (rfqData ?? []) as unknown as RfqRow[];

  // ---- My forwarder company (if any) ----
  const { data: fwdData } = await supabase
    .from("forwarder_companies")
    .select("id, company_name, slug, membership_tier, is_published, rating_avg, rating_count")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  const forwarder = fwdData as {
    id: string;
    company_name: string;
    slug: string;
    membership_tier: "free" | "premium";
    is_published: boolean;
    rating_avg: number;
    rating_count: number;
  } | null;

  let subscriptionEnd: string | null = null;
  let lanes: { origin_country: string; destination_country: string }[] = [];
  let leads: LeadRow[] = [];
  let myQuotes: MyQuoteRow[] = [];

  if (forwarder) {
    const [{ data: sub }, { data: laneData }, { data: leadData }, { data: quoteData }] =
      await Promise.all([
        supabase
          .from("subscriptions")
          .select("current_period_end")
          .eq("profile_id", user.id)
          .eq("status", "active")
          .order("current_period_end", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("forwarder_lanes")
          .select("origin_country, destination_country")
          .eq("forwarder_id", forwarder.id),
        supabase
          .from("rfqs")
          .select(
            `id, reference, mode, origin_country, origin_city,
             destination_country, destination_city, incoterm, ready_date, created_at`
          )
          .eq("status", "open")
          .neq("shipper_id", user.id)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("quotes")
          .select("id, amount, currency, status, rfq_id, rfqs ( reference, title )")
          .eq("forwarder_id", forwarder.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
    subscriptionEnd = sub?.current_period_end ?? null;
    lanes = laneData ?? [];
    leads = (leadData ?? []) as LeadRow[];
    myQuotes = (quoteData ?? []) as unknown as MyQuoteRow[];
  }

  const laneSet = new Set(lanes.map((l) => `${l.origin_country}→${l.destination_country}`));
  const onMyLane = (r: LeadRow) =>
    laneSet.has(`${r.origin_country}→${r.destination_country}`);
  const sortedLeads = [...leads].sort((a, b) => Number(onMyLane(b)) - Number(onMyLane(a)));

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display font-bold text-2xl">
            {firstName ? `Karibu, ${firstName}` : "Dashboard"}
          </h1>
          <Link
            href="/messages"
            className="text-sm font-medium text-sea border border-sea/25 hover:bg-mist transition rounded-lg px-3.5 py-2"
          >
            ✉ Messages
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 mt-6">
          {/* ================= LEFT ================= */}
          <div className="space-y-10 min-w-0">
            {/* ---- Forwarder: RFQ leads ---- */}
            {forwarder && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45">
                    Open RFQs {forwarder.membership_tier === "premium" ? "— quote to win" : ""}
                  </h2>
                  {lanes.length > 0 && (
                    <span className="font-mono text-[10px] text-ink/40">
                      ● = on your lanes
                    </span>
                  )}
                </div>
                {sortedLeads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-ink/20 bg-paper/50 px-5 py-8 text-center text-sm text-ink/60">
                    No open RFQs right now. New shipments will appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedLeads.map((r) => (
                      <Link
                        key={r.id}
                        href={`/rfq/${r.id}`}
                        className="flex items-center justify-between gap-3 border border-ink/10 bg-paper rounded-lg px-3.5 py-2.5 hover:border-tide/50 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {onMyLane(r) && <span className="text-saffron mr-1.5">●</span>}
                            {r.origin_city || r.origin_country} ({countryCode(r.origin_country)}) →{" "}
                            {r.destination_city || r.destination_country} ({countryCode(r.destination_country)})
                          </p>
                          <p className="font-mono text-[11px] text-ink/50 mt-0.5">
                            {r.reference} · {modeLabel(r.mode)}
                            {r.incoterm ? ` · ${r.incoterm}` : ""}
                            {r.ready_date ? ` · ready ${formatDate(r.ready_date)}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 bg-saffron text-ink text-xs font-semibold rounded-lg px-3.5 py-1.5">
                          {forwarder.membership_tier === "premium" ? "Quote" : "View"}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ---- Forwarder: my quotes ---- */}
            {forwarder && myQuotes.length > 0 && (
              <section>
                <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45 mb-3">
                  My recent quotes
                </h2>
                <div className="space-y-2 font-mono text-[13px]">
                  {myQuotes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/rfq/${q.rfq_id}`}
                      className="flex justify-between gap-3 border-b border-ink/5 pb-2 hover:text-sea transition"
                    >
                      <span className="truncate">
                        {q.rfqs?.reference ?? "RFQ"} · {q.currency} {Number(q.amount).toLocaleString()}
                      </span>
                      <span className={STATUS_COLOR[q.status] ?? "text-ink/40"}>{q.status}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ---- Shipper: my shipments ---- */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45">
                  My shipments
                </h2>
                <Link href="/rfq/new" className="text-xs font-semibold text-sea hover:underline">
                  + Post a shipment
                </Link>
              </div>
              {myRfqs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink/20 bg-paper/50 px-5 py-8 text-center">
                  <p className="text-sm text-ink/60">
                    You haven&apos;t posted any shipments yet.
                  </p>
                  <Link
                    href="/rfq/new"
                    className="inline-block mt-3 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-4 py-2"
                  >
                    Post your first RFQ
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myRfqs.map((r) => (
                    <Link
                      key={r.id}
                      href={`/rfq/${r.id}`}
                      className="flex items-center justify-between gap-3 border border-ink/10 bg-paper rounded-lg px-3.5 py-2.5 hover:border-tide/50 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="font-mono text-[11px] text-ink/50 mt-0.5">
                          {r.reference} · posted {formatDate(r.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-mono text-[11px] uppercase ${STATUS_COLOR[r.status] ?? "text-ink/40"}`}>
                          {r.status}
                        </p>
                        <p className="font-mono text-[11px] text-ink/50">
                          {r.quotes?.[0]?.count ?? 0} quote{(r.quotes?.[0]?.count ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ================= RIGHT ================= */}
          <aside className="space-y-4">
            {forwarder ? (
              <>
                <div
                  className={`rounded-xl border p-4 ${
                    forwarder.membership_tier === "premium"
                      ? "bg-parchment border-saffron/40"
                      : "bg-paper border-ink/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50">
                      Membership
                    </p>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        forwarder.membership_tier === "premium" ? "bg-tide" : "bg-ink/25"
                      }`}
                    />
                  </div>
                  <p className="font-display font-semibold mt-1">
                    {forwarder.membership_tier === "premium" ? "Premium · active" : "Free listing"}
                  </p>
                  {forwarder.membership_tier === "premium" ? (
                    <p className="font-mono text-[11px] text-ink/50 mt-0.5">
                      {subscriptionEnd
                        ? `Renews ${formatDate(subscriptionEnd)} · KES 2,500/mo`
                        : "KES 2,500/mo"}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-ink/60 mt-1">
                        Upgrade to receive and quote RFQ leads on your lanes.
                      </p>
                      <Link
                        href="/upgrade"
                        className="block text-center mt-3 bg-saffron hover:brightness-95 transition text-ink text-sm font-semibold rounded-lg py-2"
                      >
                        Go Premium — KES 2,500/mo
                      </Link>
                    </>
                  )}
                </div>

                <div className="bg-paper rounded-xl border border-ink/10 p-4">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50">
                    Your listing
                  </p>
                  <p className="font-display font-semibold mt-1">{forwarder.company_name}</p>
                  <p className="font-mono text-[11px] text-ink/50 mt-0.5">
                    <span className="text-saffron">★</span> {Number(forwarder.rating_avg).toFixed(1)} ({forwarder.rating_count}) ·{" "}
                    {forwarder.is_published ? "published" : "draft"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Link
                      href={`/forwarders/${forwarder.slug}`}
                      className="block text-center border border-sea/25 text-sea hover:bg-mist transition text-sm font-medium rounded-lg py-2"
                    >
                      View profile
                    </Link>
                    <Link
                      href={`/forwarders/${forwarder.slug}/edit`}
                      className="block text-center border border-sea/25 text-sea hover:bg-mist transition text-sm font-medium rounded-lg py-2"
                    >
                      Edit listing
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-parchment rounded-xl border border-ink/10 p-4">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50">
                  For forwarders
                </p>
                <p className="font-display font-semibold mt-1">Run a freight company?</p>
                <p className="text-sm text-ink/60 mt-1">
                  List it free in the directory, then go Premium to receive RFQ leads.
                </p>
                <Link
                  href="/forwarders/new"
                  className="block text-center mt-3 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg py-2"
                >
                  List your company
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
