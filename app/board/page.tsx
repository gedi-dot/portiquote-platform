import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { modeLabel, countryCode, formatDate, flagEmoji } from "@/lib/format";

// The live RFQ board. Every signed-in member can SEE open shipment requests.
// Quoting is Premium-only — enforced in the database (quotes_insert RLS) and
// surfaced on the RFQ detail page. The board routes there to quote.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live shipment board — open RFQs",
  description:
    "Open shipment requests from shippers across Africa and worldwide. Premium members quote directly on the platform.",
  // Signed-out visitors get a public explainer with no shipment data on it,
  // and a crawler is never signed in — so this page is safe to index.
};

type BoardRfq = {
  id: string;
  reference: string;
  title: string;
  mode: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  incoterm: string | null;
  container_type: string | null;
  container_count: number | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  is_hazardous: boolean;
  imdg_class: string | null;
  ready_date: string | null;
  target_delivery_date: string | null;
  hs_code: string | null;
  cargo_description: string | null;
  shipper_id: string;
  quote_deadline: string | null;
  created_at: string;
  quotes: { count: number }[];
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function BoardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitors used to be dumped on a naked login form, which asked
  // them to create an account to find out whether an account was worth having.
  // They now get an explanation of what the board is and how to reach it.
  if (!user) {
    // Show the live count only once there is enough activity for it to be an
    // argument rather than an admission. Below the threshold the page explains
    // the board without numbers, and starts showing them on its own once real
    // shipments are flowing — no code change needed at that point.
    const { count } = await supabase
      .from("rfqs")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    const openCount = count ?? 0;
    const SHOW_COUNT_FROM = 8;

    return (
      <>
        <Navbar />
        <section className="bg-sea text-paper">
          <div className="mx-auto max-w-4xl px-5 py-14">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-saffron mb-2">
              Members only
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl">
              The live shipment board
            </h1>
            <p className="mt-3 max-w-2xl text-paper/75 text-[15px] leading-relaxed">
              When a shipper posts a shipment, it lands here and in the inbox of
              every Premium forwarder covering that route. Shipment details stay
              behind sign-in, because cargo owners are trusting us with what they
              are moving and when.
              {openCount >= SHOW_COUNT_FROM
                ? ` There are ${openCount} shipments open right now.`
                : ""}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="bg-saffron text-ink font-semibold text-sm rounded-lg px-5 py-2.5 hover:brightness-95"
              >
                Create a free account
              </Link>
              <Link
                href="/login?next=/board"
                className="border border-paper/40 hover:border-paper/80 transition text-paper font-medium text-sm rounded-lg px-5 py-2.5"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-4xl px-5 py-12">
          <div className="grid sm:grid-cols-3 gap-7">
            {[
              ["Free account", "See every open shipment on the board — the route, the cargo, the dates."],
              ["Claim your listing", "Take control of your company profile in the directory. Also free."],
              ["Go Premium", "Quote on shipments, and get emailed the moment one matches your lanes."],
            ].map(([title, body]) => (
              <div key={title}>
                <h2 className="font-display font-semibold text-lg">{title}</h2>
                <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-ink/10 bg-paper p-6">
            <h2 className="font-display font-semibold text-lg">Have cargo to move instead?</h2>
            <p className="text-sm text-ink/60 mt-1.5 leading-relaxed max-w-2xl">
              Posting a shipment is free and always will be — forwarders pay for
              membership, shippers never do.
            </p>
            <Link
              href="/rfq/new"
              className="inline-block mt-4 text-sm font-semibold text-sea hover:text-ink"
            >
              Post a shipment →
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Does this member run a forwarder, and is it Premium? (Drives the CTA copy.)
  const { data: fwd } = await supabase
    .from("forwarder_companies")
    .select("id, company_name, membership_tier, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  const isForwarder = Boolean(fwd);
  const isPremium = fwd?.membership_tier === "premium";

  // Open RFQs, newest first. RLS lets any authenticated user read open RFQs.
  const { data } = await supabase
    .from("rfqs")
    .select(
      `id, reference, title, mode, origin_country, origin_city,
       destination_country, destination_city, incoterm, container_type,
       container_count, weight_kg, volume_cbm, is_hazardous, imdg_class,
       ready_date, target_delivery_date, hs_code, cargo_description,
       shipper_id, quote_deadline, created_at, quotes ( count )`
    )
    .eq("status", "open")
    .neq("shipper_id", user.id) // don't show a member their own RFQs — they manage those on the dashboard
    .order("created_at", { ascending: false })
    .limit(100);

  const rfqs = (data ?? []) as unknown as BoardRfq[];

  return (
    <>
      <Navbar />

      {/* Header band */}
      <section className="bg-sea text-paper">
        <div className="mx-auto max-w-6xl px-5 py-9">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-saffron mb-2">
            Live shipment board
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            Open shipments, ready to quote
          </h1>
          <p className="mt-3 max-w-2xl text-paper/75 text-[15px] leading-relaxed">
            Every open request shippers have posted — across Africa and worldwide.
            {isPremium
              ? " As a Premium member you can quote on any of them directly here."
              : " Quote on any of them the moment you go Premium."}
          </p>

          {/* Contextual CTA */}
          {!isForwarder && (
            <Link
              href="/forwarders/new"
              className="inline-block mt-5 bg-saffron text-ink font-semibold text-sm rounded-lg px-5 py-2.5 hover:brightness-95"
            >
              List your company to start quoting
            </Link>
          )}
          {isForwarder && !isPremium && (
            <Link
              href="/upgrade"
              className="inline-block mt-5 bg-saffron text-ink font-semibold text-sm rounded-lg px-5 py-2.5 hover:brightness-95"
            >
              Go Premium to quote — KES 2,500/mo
            </Link>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display font-semibold text-xl">
            {rfqs.length} open {rfqs.length === 1 ? "shipment" : "shipments"}
          </h2>
          {!isPremium && (
            <span className="font-mono text-[11px] text-ink/45">
              Viewing is free · quoting is Premium
            </span>
          )}
        </div>

        {rfqs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 bg-paper/50 px-6 py-14 text-center">
            <p className="font-display font-semibold text-lg">No open shipments right now</p>
            <p className="mt-1.5 text-sm text-ink/60 max-w-md mx-auto">
              When a shipper posts a request, it appears here. Check back — the
              board updates as new shipments come in.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rfqs.map((r) => {
              const quoteCount = r.quotes?.[0]?.count ?? 0;
              const load =
                r.container_type
                  ? `${r.container_count ?? 1} × ${r.container_type}`
                  : r.weight_kg
                  ? `${r.weight_kg} kg`
                  : r.volume_cbm
                  ? `${r.volume_cbm} cbm`
                  : null;
              return (
                <Link
                  key={r.id}
                  href={`/rfq/${r.id}`}
                  className="group bg-paper border border-ink/10 rounded-xl p-5 hover:border-tide/50 hover:shadow-sm transition flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] tracking-wide text-ink/40">
                        {r.reference}
                      </span>
                      <h3 className="font-display font-semibold text-[16px] leading-snug mt-0.5 group-hover:text-sea transition">
                        {r.title}
                      </h3>
                    </div>
                    {r.is_hazardous && (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-coral border border-coral/40 rounded px-1.5 py-0.5">
                        Hazmat
                      </span>
                    )}
                  </div>

                  {/* Lane */}
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-ink">
                      {flagEmoji(r.origin_country)} {[r.origin_city, r.origin_country].filter(Boolean).join(", ")}
                    </span>
                    <span className="text-tide font-mono">
                      {countryCode(r.origin_country)}→{countryCode(r.destination_country)}
                    </span>
                    <span className="font-semibold text-ink">
                      {flagEmoji(r.destination_country)} {[r.destination_city, r.destination_country].filter(Boolean).join(", ")}
                    </span>
                  </div>

                  {/* Meta chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wide bg-mist text-ink/70 rounded px-2 py-1">
                      {modeLabel(r.mode)}
                    </span>
                    {load && (
                      <span className="font-mono text-[10px] uppercase tracking-wide bg-mist text-ink/70 rounded px-2 py-1">
                        {load}
                      </span>
                    )}
                    {r.incoterm && (
                      <span className="font-mono text-[10px] uppercase tracking-wide bg-mist text-ink/70 rounded px-2 py-1">
                        {r.incoterm}
                      </span>
                    )}
                  </div>

                  {/* Cargo description + specifics */}
                  {r.cargo_description && (
                    <p className="mt-3 text-[13px] text-ink/70 leading-relaxed line-clamp-3">
                      {r.cargo_description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink/50">
                    {r.hs_code && <span>HS {r.hs_code}</span>}
                    {r.weight_kg != null && <span>{r.weight_kg} kg</span>}
                    {r.volume_cbm != null && <span>{r.volume_cbm} cbm</span>}
                    {r.ready_date && <span>Ready {formatDate(r.ready_date)}</span>}
                    {r.target_delivery_date && <span>Deliver by {formatDate(r.target_delivery_date)}</span>}
                    {r.is_hazardous && r.imdg_class && <span className="text-coral">IMDG {r.imdg_class}</span>}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-ink/8 flex items-center justify-between text-[12px] text-ink/50">
                    <span>
                      {quoteCount} {quoteCount === 1 ? "quote" : "quotes"} · posted {timeAgo(r.created_at)}
                    </span>
                    <span className="font-semibold text-sea group-hover:text-ink transition">
                      {isPremium ? "Quote →" : "View →"}
                    </span>
                  </div>
                  {r.quote_deadline && (
                    <p className="mt-1.5 font-mono text-[10px] text-ink/40">
                      Quote by {formatDate(r.quote_deadline)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
