import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ForwarderCard from "@/components/ForwarderCard";
import JsonLd from "@/components/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { countryCode, countryFromCode, modeLabel } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import type { ForwarderListing } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ lane: string }>;

function parseLane(lane: string): { origin: string; destination: string } | null {
  const m = /^([a-z]{2})-to-([a-z]{2})$/i.exec(lane);
  if (!m) return null;
  const origin = countryFromCode(m[1]);
  const destination = countryFromCode(m[2]);
  if (!origin || !destination || origin === destination) return null;
  return { origin, destination };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lane } = await params;
  const parsed = parseLane(lane);
  if (!parsed) return {};
  const { origin, destination } = parsed;
  const supabase = await createClient();
  const { count } = await supabase
    .from("forwarder_lanes")
    .select("id, forwarder_companies!inner(id)", { count: "exact", head: true })
    .eq("origin_country", origin)
    .eq("destination_country", destination)
    .eq("forwarder_companies.is_published", true);
  const n = count ?? 0;
  return {
    title: `Shipping from ${origin} to ${destination} — Compare Forwarder Quotes`,
    description: `${
      n > 0 ? `${n} vetted freight forwarder${n === 1 ? "" : "s"} serve` : "Freight forwarders serve"
    } the ${origin} → ${destination} corridor. Post your shipment once — ocean, air, road or RoRo — and compare competing quotes free.`,
    alternates: { canonical: `/routes/${lane.toLowerCase()}` },
  };
}

export default async function LanePage({ params }: { params: Params }) {
  const { lane } = await params;
  const parsed = parseLane(lane);
  if (!parsed) notFound();
  const { origin, destination } = parsed;
  const oc = countryCode(origin);
  const dc = countryCode(destination);

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("forwarder_lanes")
    .select(
      `modes,
       forwarder_companies!inner (
         id, company_name, slug, tagline, hq_country, hq_city, membership_tier,
         is_verified, is_claimed, rating_avg, rating_count, logo_url,
         forwarder_services ( services ( slug, name ) ),
         forwarder_lanes ( origin_country, destination_country, modes )
       )`
    )
    .eq("origin_country", origin)
    .eq("destination_country", destination)
    .eq("forwarder_companies.is_published", true)
    .limit(200);

  // Dedupe companies; collect the modes offered on this corridor.
  const seen = new Map<string, ForwarderListing>();
  const modeSet = new Set<string>();
  for (const r of (rows ?? []) as unknown as {
    modes: string[] | null;
    forwarder_companies: ForwarderListing;
  }[]) {
    for (const m of r.modes ?? []) modeSet.add(m);
    const f = r.forwarder_companies;
    if (f && !seen.has(f.id)) seen.set(f.id, f);
  }
  const forwarders = [...seen.values()].sort((a, b) => {
    if (a.membership_tier !== b.membership_tier)
      return a.membership_tier === "premium" ? -1 : 1;
    return Number(b.rating_avg) - Number(a.rating_avg);
  });
  const modes = [...modeSet].map(modeLabel);

  // A few sibling corridors from the same origin.
  const { data: sib } = await supabase
    .from("forwarder_lanes")
    .select("destination_country, forwarder_companies!inner(id)")
    .eq("origin_country", origin)
    .neq("destination_country", destination)
    .eq("forwarder_companies.is_published", true)
    .limit(60);
  const related = [...new Set((sib ?? []).map((s) => s.destination_country))].slice(0, 6);

  const rfqHref = `/rfq/new?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;

  return (
    <>
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Routes", item: `${SITE_URL}/routes` },
            {
              "@type": "ListItem",
              position: 3,
              name: `${origin} to ${destination}`,
              item: `${SITE_URL}/routes/${oc.toLowerCase()}-to-${dc.toLowerCase()}`,
            },
          ],
        }}
      />
      <main className="min-h-screen">
        <section className="bg-sea text-paper px-5 py-10">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-saffron">
              Corridor · {oc} → {dc}
            </p>
            <h1 className="font-display font-bold text-3xl mt-1.5">
              Shipping from {origin} to {destination}
            </h1>
            <p className="text-paper/75 text-sm mt-2 max-w-2xl">
              {forwarders.length > 0
                ? `${forwarders.length} vetted forwarder${forwarders.length === 1 ? "" : "s"} ${forwarders.length === 1 ? "serves" : "serve"} this corridor${modes.length ? ` — ${modes.join(", ")}` : ""}. Post your shipment once and compare their quotes side by side, free.`
                : `Post your shipment on this corridor and forwarders across the network will be invited to quote — free for shippers.`}
            </p>
            <div className="flex flex-wrap gap-2.5 mt-5">
              <Link href={rfqHref} className="bg-saffron text-ink font-semibold text-sm rounded-lg px-5 py-2.5">
                Post a shipment on this lane
              </Link>
              <Link
                href={`/routes/${dc.toLowerCase()}-to-${oc.toLowerCase()}`}
                className="border border-paper/25 text-paper font-medium text-sm rounded-lg px-5 py-2.5"
              >
                Reverse: {dc} → {oc}
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45">
              Forwarders on this corridor
            </h2>
            {forwarders.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                {forwarders.map((f) => (
                  <ForwarderCard key={f.id} f={f} />
                ))}
              </div>
            ) : (
              <div className="mt-3 bg-parchment border border-ink/10 rounded-xl p-6">
                <p className="font-display font-semibold">Be found on this lane</p>
                <p className="text-sm text-ink/60 mt-1">
                  No forwarder has listed {origin} → {destination} yet. If you run
                  this corridor, a free listing puts you here.
                </p>
                <Link href="/forwarders/new" className="inline-block mt-3 bg-sea text-paper text-sm font-semibold rounded-lg px-4 py-2">
                  List your company
                </Link>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                ["01", "Post once", `Lane ${oc} → ${dc}, mode, cargo, Incoterm — two minutes, free.`],
                ["02", "Quotes compete", "Premium forwarders on this corridor are emailed instantly and reply with priced quotes."],
                ["03", "Compare & ship", "Price, transit and validity side by side. Message any forwarder, accept the best."],
              ].map(([n, h, b]) => (
                <div key={n} className="bg-paper border border-ink/10 rounded-xl p-4">
                  <p className="font-mono text-sm text-tide">{n}</p>
                  <p className="font-display font-semibold mt-1">{h}</p>
                  <p className="text-sm text-ink/60 mt-1">{b}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-8">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mr-1">
                Also from {origin}:
              </span>
              {related.map((d) => (
                <Link
                  key={d}
                  href={`/routes/${oc.toLowerCase()}-to-${countryCode(d).toLowerCase()}`}
                  className="font-mono text-xs bg-paper border border-ink/10 hover:border-tide/60 rounded-lg px-3 py-1.5 text-sea transition"
                >
                  {oc} → {countryCode(d)}
                </Link>
              ))}
              <Link href={`/countries/${oc.toLowerCase()}`} className="font-mono text-xs text-sea underline underline-offset-2 ml-1">
                All {origin} forwarders
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
