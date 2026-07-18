import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuoteForm from "@/components/QuoteForm";
import QuoteActions from "@/components/QuoteActions";
import MessageThread from "@/components/MessageThread";
import { createClient } from "@/lib/supabase/server";
import RfqStatusActions from "@/components/RfqStatusActions";
import { countryCode, modeLabel, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type Rfq = {
  id: string;
  shipper_id: string;
  reference: string;
  title: string;
  mode: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  incoterm: string | null;
  cargo_description: string | null;
  hs_code: string | null;
  container_type: string | null;
  container_count: number | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  is_hazardous: boolean;
  imdg_class: string | null;
  ready_date: string | null;
  status: string;
  created_at: string;
};

type Quote = {
  id: string;
  forwarder_id: string;
  amount: number;
  currency: string;
  transit_time_days: number | null;
  valid_until: string | null;
  notes: string | null;
  status: string;
  forwarder_companies: {
    owner_id: string;
    company_name: string;
    slug: string;
    hq_city: string | null;
    hq_country: string;
    rating_avg: number;
    rating_count: number;
    membership_tier: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
  } | null;
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-tide/15 text-tide",
  awarded: "bg-saffron/20 text-ink",
  closed: "bg-ink/10 text-ink/60",
  expired: "bg-ink/10 text-ink/60",
  cancelled: "bg-coral/15 text-coral",
};

function money(amount: number, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString()}`;
}

export default async function RfqDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rfqData } = await supabase
    .from("rfqs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!rfqData) notFound();
  const rfq = rfqData as Rfq;

  // RLS scopes this automatically: the shipper sees every quote,
  // a forwarder sees only their own.
  const { data: quoteData } = await supabase
    .from("quotes")
    .select(
      `id, forwarder_id, amount, currency, transit_time_days, valid_until, notes, status,
       forwarder_companies ( owner_id, company_name, slug, hq_city, hq_country,
                             rating_avg, rating_count, membership_tier,
                             email, phone, whatsapp )`
    )
    .eq("rfq_id", rfq.id)
    .order("amount", { ascending: true });
  const quotes = (quoteData ?? []) as unknown as Quote[];

  const isShipper = user.id === rfq.shipper_id;

  // Forwarder context (for the quote form).
  type MyForwarder = { id: string; company_name: string; membership_tier: string };
  let myForwarder: MyForwarder | null = null;
  if (!isShipper) {
    const { data } = await supabase
      .from("forwarder_companies")
      .select("id, company_name, membership_tier")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    myForwarder = data as MyForwarder | null;
  }
  const myQuote = myForwarder
    ? quotes.find((q) => q.forwarder_id === myForwarder!.id) ?? null
    : null;

  const lowestId =
    quotes.filter((q) => q.status !== "withdrawn").length > 0
      ? quotes.filter((q) => q.status !== "withdrawn")[0].id
      : null;

  const facts: { label: string; value: string }[] = [
    { label: "Mode", value: modeLabel(rfq.mode) },
    ...(rfq.incoterm ? [{ label: "Incoterm", value: rfq.incoterm }] : []),
    ...(rfq.ready_date ? [{ label: "Ready", value: formatDate(rfq.ready_date) }] : []),
    ...(rfq.container_type
      ? [{ label: "Equipment", value: `${rfq.container_count ?? 1} × ${rfq.container_type}` }]
      : []),
    ...(rfq.weight_kg
      ? [{ label: "Weight", value: `${Number(rfq.weight_kg).toLocaleString()} kg` }]
      : []),
    ...(rfq.volume_cbm ? [{ label: "Volume", value: `${rfq.volume_cbm} CBM` }] : []),
    ...(rfq.is_hazardous
      ? [{ label: "IMDG", value: rfq.imdg_class ? `Class ${rfq.imdg_class}` : "Yes" }]
      : []),
    ...(rfq.hs_code ? [{ label: "HS code", value: rfq.hs_code }] : []),
  ];

  return (
    <>
      <Navbar />

      {/* ---- RFQ header ---- */}
      <section className="relative overflow-hidden bg-sea text-paper">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 120% at 12% 0%, #0B4A54 0%, #062A2E 100%)" }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-8">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="text-saffron">{rfq.reference}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase ${
                STATUS_STYLE[rfq.status] ?? "bg-ink/10 text-ink/60"
              }`}
            >
              {rfq.status}
            </span>
          </div>
          <h1 className="font-display font-bold text-xl sm:text-2xl mt-1.5">
            {rfq.origin_city || rfq.origin_country} ({countryCode(rfq.origin_country)}) →{" "}
            {rfq.destination_city || rfq.destination_country} ({countryCode(rfq.destination_country)})
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
            {facts.map((fact) => (
              <div key={fact.label} className="font-mono text-[11px]">
                <span className="text-paper/50 uppercase tracking-wide">{fact.label}</span>{" "}
                <span className="text-paper">{fact.value}</span>
              </div>
            ))}
          </div>
          {rfq.cargo_description && (
            <p className="mt-3 text-sm text-paper/75 max-w-2xl">{rfq.cargo_description}</p>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* =========================== SHIPPER VIEW =========================== */}
        {isShipper && (
          <>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-semibold text-xl">
                Quotes <span className="font-mono text-sm text-ink/50">({quotes.length})</span>
              </h2>
              {rfq.status === "awarded" && (
                <span className="font-mono text-[11px] text-ink/50">
                  Awarded — the accepted forwarder is highlighted
                </span>
              )}
            </div>

            <RfqStatusActions rfqId={rfq.id} status={rfq.status} />

            {quotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/20 bg-paper/50 px-6 py-12 text-center">
                <p className="font-display font-semibold text-lg">No quotes yet</p>
                <p className="mt-1.5 text-sm text-ink/60 max-w-md mx-auto">
                  Premium forwarders on your lane can see this RFQ. Quotes usually arrive within
                  hours — check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => {
                  const fc = q.forwarder_companies;
                  const isBest = q.id === lowestId && rfq.status === "open";
                  const isAccepted = q.status === "accepted";
                  return (
                    <div
                      key={q.id}
                      className={`relative bg-paper rounded-xl border p-4 ${
                        isAccepted
                          ? "border-tide/50 ring-1 ring-tide/25"
                          : isBest
                          ? "border-saffron/40 ring-1 ring-saffron/20"
                          : "border-ink/10"
                      }`}
                    >
                      {isBest && !isAccepted && (
                        <span className="absolute -top-2.5 left-4 font-mono text-[9px] tracking-[0.18em] uppercase text-ink bg-saffron rounded px-2 py-0.5">
                          Lowest price
                        </span>
                      )}
                      {isAccepted && (
                        <span className="absolute -top-2.5 left-4 font-mono text-[9px] tracking-[0.18em] uppercase text-paper bg-tide rounded px-2 py-0.5">
                          Accepted
                        </span>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-1">
                        <div>
                          <p className="font-display font-semibold text-sm">
                            {fc ? (
                              <Link href={`/forwarders/${fc.slug}`} className="hover:underline">
                                {fc.company_name}
                              </Link>
                            ) : (
                              "Forwarder"
                            )}
                            {fc?.membership_tier === "premium" && (
                              <span className="font-mono text-[9px] uppercase text-ink bg-saffron/90 rounded px-1.5 py-0.5 ml-1.5">
                                Premium
                              </span>
                            )}
                          </p>
                          {fc && (
                            <p className="font-mono text-[11px] text-ink/55 mt-0.5">
                              <span className="text-saffron">★</span> {Number(fc.rating_avg).toFixed(1)} ({fc.rating_count}) ·{" "}
                              {[fc.hq_city, fc.hq_country].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {fc && (fc.email || fc.phone) && (
                            <p className="font-mono text-[11px] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                              {fc.email && (
                                <a href={`mailto:${fc.email}`} className="text-sea hover:underline">
                                  {fc.email}
                                </a>
                              )}
                              {fc.phone && (
                                <a href={`tel:${fc.phone}`} className="text-ink/65 hover:text-ink">
                                  {fc.phone}
                                </a>
                              )}
                            </p>
                          )}
                          {q.notes && <p className="text-sm text-ink/60 mt-1.5 max-w-xl">{q.notes}</p>}
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Transit</p>
                            <p className="font-mono text-sm">
                              {q.transit_time_days ? `${q.transit_time_days}d` : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Valid to</p>
                            <p className="font-mono text-sm">{formatDate(q.valid_until)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Total</p>
                            <p className="font-display font-bold text-lg">{money(q.amount, q.currency)}</p>
                          </div>
                          {rfq.status === "open" && q.status === "submitted" && (
                            <QuoteActions quoteId={q.id} rfqId={rfq.id} />
                          )}
                        </div>
                      </div>
                      {fc && (
                        <MessageThread
                          rfqId={rfq.id}
                          otherUserId={fc.owner_id}
                          otherName={fc.company_name}
                          meId={user.id}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========================== FORWARDER VIEW ========================== */}
        {!isShipper && (
          <div className="max-w-xl">
            <h2 className="font-display font-semibold text-xl mb-4">Quote this shipment</h2>

            {!myForwarder && (
              <div className="bg-parchment rounded-xl border border-ink/10 p-5">
                <p className="font-display font-semibold">List your company to quote</p>
                <p className="text-sm text-ink/60 mt-1.5">
                  Create a free listing first, then upgrade to Premium to submit quotes on RFQs
                  like this one.
                </p>
                <Link href="/forwarders/new" className="inline-block mt-3 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-4 py-2">
                  List your company
                </Link>
              </div>
            )}

            {myForwarder && myQuote && (
              <div className="bg-paper rounded-xl border border-tide/40 ring-1 ring-tide/20 p-5">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-tide">
                  Quote submitted
                </p>
                <p className="font-display font-bold text-2xl mt-1">
                  {money(myQuote.amount, myQuote.currency)}
                </p>
                <p className="font-mono text-[12px] text-ink/55 mt-1">
                  {myQuote.transit_time_days ? `${myQuote.transit_time_days} days transit · ` : ""}
                  valid to {formatDate(myQuote.valid_until)} · status: {myQuote.status}
                </p>
                {myQuote.notes && <p className="text-sm text-ink/60 mt-2">{myQuote.notes}</p>}
                <p className="text-xs text-ink/45 mt-3">
                  The shipper will see your quote alongside competing offers.
                </p>
              </div>
            )}

            {myForwarder && myQuote && (
              <div className="mt-4 bg-paper rounded-xl border border-ink/10 p-4">
                <MessageThread
                  rfqId={rfq.id}
                  otherUserId={rfq.shipper_id}
                  otherName="the shipper"
                  meId={user.id}
                  defaultOpen
                />
              </div>
            )}

            {myForwarder && !myQuote && rfq.status !== "open" && (
              <div className="bg-mist rounded-xl p-5 text-sm text-ink/60">
                This RFQ is {rfq.status} and no longer accepting quotes.
              </div>
            )}

            {myForwarder && !myQuote && rfq.status === "open" && (
              myForwarder.membership_tier === "premium" ? (
                <QuoteForm rfqId={rfq.id} forwarderId={myForwarder.id} />
              ) : (
                <div className="bg-parchment rounded-xl border border-saffron/40 p-5">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50">
                    Premium required
                  </p>
                  <p className="font-display font-semibold mt-1">
                    Quoting is a Premium feature
                  </p>
                  <p className="text-sm text-ink/60 mt-1.5">
                    {myForwarder.company_name} has a free listing. Upgrade to Premium to submit
                    quotes and receive leads on your lanes.
                  </p>
                  <Link href="/upgrade" className="inline-block mt-3 bg-saffron hover:brightness-95 transition text-ink text-sm font-semibold rounded-lg px-4 py-2">
                    Go Premium — KES 2,500/mo
                  </Link>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </>
  );
}
