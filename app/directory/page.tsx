import Navbar from "@/components/Navbar";
import ForwarderRow from "@/components/ForwarderRow";
import DirectoryPager from "@/components/DirectoryPager";
import RouteMotif from "@/components/RouteMotif";
import { createClient } from "@/lib/supabase/server";
import { ORIGIN_COUNTRIES, DESTINATION_COUNTRIES, flagEmoji } from "@/lib/format";
import type { ForwarderListing, ServiceOption } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Forwarder Directory — Search by Lane & Service",
  description:
    "Search vetted African and global freight forwarders by origin, destination and service — ocean, air, road and RoRo. Free listings, verified companies, competing quotes.",
  alternates: { canonical: "/directory" },
};

const PER_PAGE = 10;

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
  const page = Math.max(1, parseInt(str(sp.page) ?? "1", 10) || 1);

  const supabase = await createClient();

  const { data: serviceRows } = await supabase
    .from("services")
    .select("slug, name, category")
    .order("name");
  const services = (serviceRows ?? []) as ServiceOption[];

  // Are in-memory filters active? (lane/service can't be filtered in SQL here)
  const inMemoryFilter = Boolean(origin || destination || service);

  const selectCols = `id, company_name, slug, tagline, hq_country, hq_city, membership_tier,
       is_verified, is_claimed, rating_avg, rating_count, logo_url, website, phone, email,
       forwarder_services ( services ( slug, name ) ),
       forwarder_lanes ( origin_country, destination_country, modes )`;

  const applySort = <T,>(query: T): T => {
    // @ts-expect-error - supabase builder chaining
    let qy = query.order("membership_tier", { ascending: false });
    if (sort === "name") qy = qy.order("company_name", { ascending: true });
    else if (sort === "reviews") qy = qy.order("rating_count", { ascending: false });
    else qy = qy.order("rating_avg", { ascending: false });
    return qy;
  };

  let forwarders: ForwarderListing[] = [];
  let totalCount = 0;

  if (!inMemoryFilter) {
    // Fast path: paginate in the database. Only 15 rows come back per page.
    let countQ = supabase
      .from("forwarder_companies")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);
    if (q) countQ = countQ.ilike("company_name", `%${q}%`);
    const { count } = await countQ;
    totalCount = count ?? 0;

    let query = supabase
      .from("forwarder_companies")
      .select(selectCols)
      .eq("is_published", true);
    if (q) query = query.ilike("company_name", `%${q}%`);
    query = applySort(query);
    query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    const { data } = await query;
    forwarders = (data ?? []) as unknown as ForwarderListing[];
  } else {
    // Filter path: fetch matching set, filter in memory, then slice the page.
    let query = supabase
      .from("forwarder_companies")
      .select(selectCols)
      .eq("is_published", true);
    if (q) query = query.ilike("company_name", `%${q}%`);
    query = applySort(query);
    const { data } = await query;
    let all = (data ?? []) as unknown as ForwarderListing[];

    if (origin || destination) {
      all = all.filter((f) =>
        (f.forwarder_lanes ?? []).some(
          (l) =>
            (!origin || l.origin_country === origin) &&
            (!destination || l.destination_country === destination)
        )
      );
    }
    if (service) {
      all = all.filter((f) =>
        (f.forwarder_services ?? []).some((s) => s.services?.slug === service)
      );
    }

    totalCount = all.length;
    forwarders = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // Build a hrefs that preserve every active param and swap ?page=
  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (service) params.set("service", service);
    if (q) params.set("q", q);
    if (sort !== "rating") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/directory?${qs}` : "/directory";
  };

  // Sort links (server-rendered, preserve filters, reset to page 1)
  const sortHref = (value: string) => {
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (service) params.set("service", service);
    if (q) params.set("q", q);
    if (value !== "rating") params.set("sort", value);
    const qs = params.toString();
    return qs ? `/directory?${qs}` : "/directory";
  };

  const from = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, totalCount);

  return (
    <>
      <Navbar />

      {/* ---- Hero + search ---- */}
      <section className="relative overflow-hidden bg-sea text-paper">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "radial-gradient(120% 100% at 15% 0%, #0B4A54 0%, #062A2E 100%)" }}
        />
        <RouteMotif />
        <div className="relative mx-auto max-w-6xl px-5 pt-14 pb-9">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-saffron mb-3">
            Freight forwarder directory
          </p>
          <h1 className="font-display font-bold leading-[1.05] text-3xl sm:text-4xl max-w-2xl">
            Find a forwarder
          </h1>
          <p className="mt-4 max-w-xl text-paper/75 text-[15px] leading-relaxed">
            Search vetted forwarders by lane, mode, and service — ocean, air, road,
            and RoRo across Africa and the world&apos;s major trade hubs.
          </p>

          <form
            action="/directory"
            className="mt-7 bg-paper text-ink rounded-xl p-2 sm:p-2.5 shadow-lg max-w-3xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <label className="flex flex-col px-3 py-1.5">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Origin</span>
                <select name="origin" defaultValue={origin ?? ""} className="bg-transparent text-sm font-medium outline-none -ml-0.5">
                  <option value="">Any origin</option>
                  {ORIGIN_COUNTRIES.map((c) => <option key={c} value={c}>{flagEmoji(c)} {c}</option>)}
                </select>
              </label>
              <label className="flex flex-col px-3 py-1.5 border-t sm:border-t-0 sm:border-l border-ink/10">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Destination</span>
                <select name="destination" defaultValue={destination ?? ""} className="bg-transparent text-sm font-medium outline-none -ml-0.5">
                  <option value="">Any destination</option>
                  {DESTINATION_COUNTRIES.map((c) => <option key={c} value={c}>{flagEmoji(c)} {c}</option>)}
                </select>
              </label>
              <label className="flex flex-col px-3 py-1.5 border-t sm:border-t-0 sm:border-l border-ink/10">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Service</span>
                <select name="service" defaultValue={service ?? ""} className="bg-transparent text-sm font-medium outline-none -ml-0.5">
                  <option value="">Any service</option>
                  {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </label>
              <button type="submit" className="bg-sea hover:bg-ink transition text-paper font-semibold text-sm rounded-lg px-6 py-3">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ---- Directory list ---- */}
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display font-semibold text-xl">
            {totalCount} forwarder{totalCount === 1 ? "" : "s"}
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-ink/45">
              {from}–{to} of {totalCount}
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45">Sort</span>
            <div className="flex gap-1 text-xs">
              {[
                ["rating", "Top rated"],
                ["reviews", "Most reviewed"],
                ["name", "A–Z"],
              ].map(([val, label]) => (
                <a
                  key={val}
                  href={sortHref(val)}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                    sort === val ? "bg-sea text-paper" : "bg-mist text-ink/70 hover:bg-ink/5"
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {forwarders.length > 0 ? (
          <>
            {/* Column headers (desktop) */}
            <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 border-b border-ink/15 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">
              <span className="w-11 shrink-0" />
              <span className="flex-1">Company &amp; contact</span>
              <span className="hidden lg:block w-52">Services</span>
              <span className="w-20 text-right">Status</span>
            </div>

            <div className="bg-paper rounded-b-xl border-x border-b border-ink/10 overflow-hidden">
              {forwarders.map((f) => (
                <ForwarderRow key={f.id} f={f} />
              ))}
            </div>

            <DirectoryPager page={page} totalPages={totalPages} makeHref={makeHref} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-ink/20 bg-paper/50 px-6 py-12 text-center">
            <p className="font-display font-semibold text-lg">No forwarders match that search</p>
            <p className="mt-1.5 text-sm text-ink/60 max-w-md mx-auto">
              Try widening your lane or service — or if this is your business, list
              your company free.
            </p>
            <a href="/signup" className="inline-block mt-4 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg px-5 py-2.5">
              List your company
            </a>
          </div>
        )}
      </main>

      <footer className="border-t border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-wide text-ink/45">
            FREIGHTPAIR — freight forwarder marketplace
          </p>
          <p className="font-mono text-[11px] tracking-wide text-ink/45">
            Nairobi · Indian Ocean coast · worldwide
          </p>
        </div>
      </footer>
    </>
  );
}
