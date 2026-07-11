import Navbar from "@/components/Navbar";
import ForwarderCard from "@/components/ForwarderCard";
import SortBar from "@/components/SortBar";
import RouteMotif from "@/components/RouteMotif";
import { createClient } from "@/lib/supabase/server";
import { ORIGIN_COUNTRIES, DESTINATION_COUNTRIES } from "@/lib/format";
import type { ForwarderListing, ServiceOption } from "@/lib/types";

// The directory reads live data on each request (and respects the visitor's
// session), so it is always dynamic.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const origin = str(sp.origin);
  const destination = str(sp.destination);
  const service = str(sp.service);
  const q = str(sp.q);
  const sort = str(sp.sort) ?? "rating";

  const supabase = await createClient();

  // Service list for the search dropdown.
  const { data: serviceRows } = await supabase
    .from("services")
    .select("slug, name, category")
    .order("name");
  const services = (serviceRows ?? []) as ServiceOption[];

  // Published listings, Premium first, then the chosen sort order.
  let query = supabase
    .from("forwarder_companies")
    .select(
      `id, company_name, slug, tagline, hq_country, hq_city, membership_tier,
       is_verified, rating_avg, rating_count, logo_url,
       forwarder_services ( services ( slug, name ) ),
       forwarder_lanes ( origin_country, destination_country, modes )`
    )
    .eq("is_published", true);

  if (q) query = query.ilike("company_name", `%${q}%`);

  query = query.order("membership_tier", { ascending: false });
  if (sort === "name") query = query.order("company_name", { ascending: true });
  else if (sort === "reviews") query = query.order("rating_count", { ascending: false });
  else query = query.order("rating_avg", { ascending: false });

  const { data } = await query;
  let forwarders = (data ?? []) as unknown as ForwarderListing[];

  // Lane + service filters (applied in memory against the embedded relations).
  if (origin || destination) {
    forwarders = forwarders.filter((f) =>
      (f.forwarder_lanes ?? []).some(
        (l) =>
          (!origin || l.origin_country === origin) &&
          (!destination || l.destination_country === destination)
      )
    );
  }
  if (service) {
    forwarders = forwarders.filter((f) =>
      (f.forwarder_services ?? []).some((s) => s.services?.slug === service)
    );
  }

  return (
    <>
      <Navbar />

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-sea text-paper">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(120% 100% at 15% 0%, #0B4A54 0%, #062A2E 100%)",
          }}
        />
        <RouteMotif />

        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-10">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-saffron mb-4">
            Freight forwarder marketplace
          </p>
          <h1 className="font-display font-bold leading-[1.05] text-4xl sm:text-5xl max-w-2xl">
            Rooted in Africa.
            <br />
            Moving cargo worldwide.
          </h1>
          <p className="mt-5 max-w-xl text-paper/75 text-[15px] leading-relaxed">
            Post your shipment once and let vetted forwarders compete for it — or
            search the directory by lane, mode, and service. Ocean, air, road, and
            RoRo across every major African gateway.
          </p>

          {/* Lane + service search (GET form, works without JavaScript) */}
          <form
            action="/"
            className="mt-8 bg-paper text-ink rounded-xl p-2 sm:p-2.5 shadow-lg max-w-3xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <label className="flex flex-col px-3 py-1.5">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Origin</span>
                <select name="origin" defaultValue={origin ?? ""} className="bg-transparent text-sm font-medium outline-none -ml-0.5">
                  <option value="">Any origin</option>
                  {ORIGIN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col px-3 py-1.5 border-t sm:border-t-0 sm:border-l border-ink/10">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Destination</span>
                <select name="destination" defaultValue={destination ?? ""} className="bg-transparent text-sm font-medium outline-none -ml-0.5">
                  <option value="">Any destination</option>
                  {DESTINATION_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col px-3 py-1.5 border-t sm:border-t-0 sm:border-l border-ink/10">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Service</span>
                <select name="service" defaultValue={service ?? ""} className="bg-transparent text-sm font-medium outline-none -ml-0.5">
                  <option value="">Any service</option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="bg-sea hover:bg-ink transition text-paper font-semibold text-sm rounded-lg px-6 py-3">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ---- Directory ---- */}
      <main className="mx-auto max-w-6xl px-5 py-8">
        <SortBar count={forwarders.length} />

        {forwarders.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forwarders.map((f) => (
              <ForwarderCard key={f.id} f={f} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-ink/20 bg-paper/50 px-6 py-12 text-center">
            <p className="font-display font-semibold text-lg">No forwarders here yet</p>
            <p className="mt-1.5 text-sm text-ink/60 max-w-md mx-auto">
              Widen your lane or service — or if this is your business, list your
              company free and be the first in the directory.
            </p>
            <a
              href="/signup"
              className="inline-block mt-4 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-5 py-2.5"
            >
              List your company
            </a>
          </div>
        )}
      </main>

      <footer className="border-t border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-wide text-ink/45">
            N.K. GEDI &amp; CO. — freight forwarder marketplace
          </p>
          <p className="font-mono text-[11px] tracking-wide text-ink/45">
            Nairobi · Indian Ocean coast · worldwide
          </p>
        </div>
      </footer>
    </>
  );
}
