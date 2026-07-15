import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ForwarderCard from "@/components/ForwarderCard";
import { createClient } from "@/lib/supabase/server";
import { countryFromCode, countryCode } from "@/lib/format";
import type { ForwarderListing } from "@/lib/types";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = countryFromCode(code);
  if (!country) return {};
  return {
    title: `Freight Forwarders in ${country} — Compare Shipping Quotes`,
    description: `Find vetted freight forwarders based in ${country} and companies serving its trade lanes. Post a shipment once — ocean, air, road or RoRo — and compare competing quotes free.`,
    alternates: { canonical: `/countries/${code.toLowerCase()}` },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = countryFromCode(code);
  if (!country) notFound();

  const supabase = await createClient();

  // Forwarders headquartered in this country
  const { data: based } = await supabase
    .from("forwarder_companies")
    .select(
      `id, company_name, slug, tagline, hq_country, hq_city, membership_tier,
       is_verified, is_claimed, rating_avg, rating_count, logo_url,
       forwarder_services ( services ( slug, name ) ),
       forwarder_lanes ( origin_country, destination_country, modes )`
    )
    .eq("is_published", true)
    .eq("hq_country", country)
    .order("membership_tier", { ascending: false })
    .order("rating_avg", { ascending: false });

  // Forwarders elsewhere who serve lanes from this country
  const { data: lanes } = await supabase
    .from("forwarder_lanes")
    .select("forwarder_id")
    .eq("origin_country", country);
  const laneIds = [...new Set((lanes ?? []).map((l) => l.forwarder_id))].filter(
    (id) => !(based ?? []).some((b) => b.id === id)
  );

  let serving: ForwarderListing[] = [];
  if (laneIds.length > 0) {
    const { data } = await supabase
      .from("forwarder_companies")
      .select(
        `id, company_name, slug, tagline, hq_country, hq_city, membership_tier,
         is_verified, is_claimed, rating_avg, rating_count, logo_url,
         forwarder_services ( services ( slug, name ) ),
         forwarder_lanes ( origin_country, destination_country, modes )`
      )
      .eq("is_published", true)
      .in("id", laneIds)
      .order("membership_tier", { ascending: false });
    serving = (data ?? []) as unknown as ForwarderListing[];
  }

  const basedList = (based ?? []) as unknown as ForwarderListing[];

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/countries" className="font-mono text-[11px] text-ink/50 hover:text-ink">
            ← All countries
          </Link>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-sm text-sea bg-mist rounded px-2 py-1">{countryCode(country)}</span>
            <h1 className="font-display font-bold text-3xl">Freight forwarders in {country}</h1>
          </div>
          <p className="text-ink/60 mt-2">
            {basedList.length > 0
              ? `${basedList.length} forwarder${basedList.length === 1 ? "" : "s"} headquartered here.`
              : "No forwarders headquartered here yet — be the first."}
          </p>

          {basedList.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {basedList.map((f) => (
                <ForwarderCard key={f.id} f={f} />
              ))}
            </div>
          ) : (
            <div className="mt-6 bg-paper border border-ink/10 rounded-xl p-6">
              <p className="text-sm text-ink/70">
                Run a forwarding company in {country}? A listing is free and takes five minutes.
              </p>
              <Link href="/forwarders/new" className="inline-block mt-3 bg-sea text-paper font-semibold text-sm rounded-lg px-4 py-2">
                List your company
              </Link>
            </div>
          )}

          {serving.length > 0 && (
            <>
              <h2 className="font-display font-semibold text-xl mt-10">
                Also serving lanes from {country}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {serving.map((f) => (
                  <ForwarderCard key={f.id} f={f} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
