import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createPublicClient } from "@/lib/supabase/public";
import { REGIONS, countryCode, flagEmoji } from "@/lib/format";

export const revalidate = 3600; // speed pass: cached, refreshed every 3600s

export const metadata = { title: "Forwarders by Country — GasDi Caravan" };

export default async function CountriesPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("forwarder_companies")
    .select("hq_country")
    .eq("is_published", true);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.hq_country, (counts.get(row.hq_country) ?? 0) + 1);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide">Directory</p>
          <h1 className="font-display font-bold text-3xl mt-1">Forwarders by country</h1>
          <p className="text-ink/60 mt-2 max-w-xl">
            151 countries across Africa, Europe, Asia &amp; the Middle East, and the Americas.
            African coverage runs the full 54 states — coast, corridor, and landlocked alike.
          </p>

          {REGIONS.map((region) => (
            <section key={region.name} className="mt-10">
              <h2 className="font-display font-semibold text-xl">
                {region.name}
                <span className="font-mono text-[11px] text-ink/40 ml-2">{region.countries.length} countries</span>
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[...region.countries].sort((a, b) => a.localeCompare(b)).map((name) => {
                  const n = counts.get(name) ?? 0;
                  return (
                    <Link
                      key={name}
                      href={`/countries/${countryCode(name).toLowerCase()}`}
                      className="group flex items-center justify-between bg-paper border border-ink/10 rounded-lg px-3 py-2.5 hover:border-tide/50 transition"
                    >
                      <span className="text-sm text-ink/80 group-hover:text-ink truncate">
                        <span className="mr-1.5">{flagEmoji(name)}</span>
                        {name}
                        <span className="font-mono text-[10px] text-ink/40 ml-1.5">{countryCode(name)}</span>
                      </span>
                      {n > 0 && (
                        <span className="font-mono text-[10px] text-ink bg-saffron/80 rounded px-1.5 py-0.5 shrink-0">{n}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
