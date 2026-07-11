import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { countryCode, COUNTRIES } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trade Routes & Shipping Corridors",
  description:
    "Browse active freight corridors — compare forwarders and request quotes on lanes from African origins to ports worldwide.",
  alternates: { canonical: "/routes" },
};

export default async function RoutesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forwarder_lanes")
    .select("origin_country, destination_country, forwarder_companies!inner(id)")
    .eq("forwarder_companies.is_published", true)
    .limit(2000);

  // Group destinations per origin, Africa-first ordering.
  const byOrigin = new Map<string, Set<string>>();
  for (const l of data ?? []) {
    if (!byOrigin.has(l.origin_country)) byOrigin.set(l.origin_country, new Set());
    byOrigin.get(l.origin_country)!.add(l.destination_country);
  }
  const order = (c: string) => {
    const i = COUNTRIES.indexOf(c);
    return i === -1 ? 999 : i;
  };
  const origins = [...byOrigin.keys()].sort((a, b) => order(a) - order(b));

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
            Corridors
          </p>
          <h1 className="font-display font-bold text-3xl mt-1">
            Trade routes with active forwarders
          </h1>
          <p className="text-sm text-ink/60 mt-2 max-w-2xl">
            Every corridor below has at least one vetted forwarder ready to
            quote. Pick a lane to compare companies — or post your shipment and
            let them come to you.
          </p>

          {origins.length === 0 && (
            <div className="mt-8 bg-parchment border border-ink/10 rounded-xl p-6">
              <p className="font-display font-semibold">Routes are filling in</p>
              <p className="text-sm text-ink/60 mt-1">
                As forwarders list their lanes, active corridors appear here.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-7">
            {origins.map((o) => (
              <section key={o}>
                <h2 className="font-display font-semibold text-lg">
                  From {o}
                  <span className="font-mono text-[11px] text-ink/45 ml-2">
                    {countryCode(o)}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {[...byOrigin.get(o)!]
                    .sort((a, b) => order(a) - order(b))
                    .map((d) => (
                      <Link
                        key={d}
                        href={`/routes/${countryCode(o).toLowerCase()}-to-${countryCode(d).toLowerCase()}`}
                        className="font-mono text-xs bg-paper border border-ink/10 hover:border-tide/60 rounded-lg px-3 py-1.5 text-sea transition"
                      >
                        {countryCode(o)} → {countryCode(d)}
                        <span className="text-ink/50"> · {d}</span>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
