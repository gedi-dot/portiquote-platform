import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import FaqBlock, { type Faq } from "@/components/FaqBlock";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Importing a Car from Japan to Mombasa — Costs, Duty & Process (2026)",
  description:
    "What it really costs to import a used car from Japan to Kenya in 2026: the 8-year rule, KRA duty stack on CRSP value, KEBS pre-shipment inspection, RoRo vs container, and clearing at Mombasa.",
  alternates: { canonical: "/guides/import-car-japan-kenya" },
};

const DUTIES = [
  {
    name: "Import Duty",
    rate: "25%",
    base: "Customs value (CRSP-based)",
    note: "Reduced from 35% in July 2025 — many older guides still quote the old rate.",
  },
  {
    name: "Excise Duty",
    rate: "20% / 25%",
    base: "Customs value + import duty",
    note: "20% at 1,500cc and below, 25% above. Hybrids and EVs attract a preferential 10%.",
  },
  {
    name: "VAT",
    rate: "16%",
    base: "Customs value + import duty + excise",
    note: "Charged on the running total, which is why the stack compounds so heavily.",
  },
  {
    name: "Import Declaration Fee (IDF)",
    rate: "3.5%",
    base: "Customs value",
    note: "A processing fee, charged directly on the customs value.",
  },
  {
    name: "Railway Development Levy (RDL)",
    rate: "2%",
    base: "Customs value",
    note: "Infrastructure levy, also charged directly on the customs value.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Check the car is eligible before you pay for it",
    body: "Kenya bars vehicles more than eight years old, and it must be right-hand drive. For a 2026 clearance that means a 2019 vehicle or newer. Note the eight years is generally counted from first registration, not manufacture — so a car built in 2018 but first registered in 2019 can still qualify. Verify the date on the Japanese export certificate before any money moves.",
  },
  {
    n: "02",
    title: "Book the pre-shipment inspection",
    body: "Every vehicle must pass a roadworthiness and standards inspection in Japan before loading, under KEBS standard KS 1515:2000, carried out by a KEBS-appointed agent. Budget roughly $150–$250. A car that ships without the certificate risks rejection at Mombasa at your cost.",
  },
  {
    n: "03",
    title: "Choose RoRo or container",
    body: "RoRo (roll-on/roll-off) is the default for a single running vehicle — the car is driven aboard a dedicated car carrier. It is usually cheaper and simpler. A container makes sense when you are shipping two or more cars, a non-runner, or want spare parts and personal effects loaded with the vehicle.",
  },
  {
    n: "04",
    title: "Understand how KRA values your car",
    body: "This is where most first-time importers get a shock. KRA does not calculate duty on what you paid. It uses the Current Retail Selling Price (CRSP) — its own published value for that model — then applies depreciation for age. If the CRSP value exceeds your invoice, and it often does, your duty is assessed on the higher figure.",
  },
  {
    n: "05",
    title: "Clear at Mombasa",
    body: "A licensed clearing agent lodges the entry, duties are paid through KRA's iTax system, and KEBS confirms compliance before release. Delays are almost always documentation problems — a missing export certificate, inspection certificate, or bill of lading — not port congestion.",
  },
  {
    n: "06",
    title: "Register with NTSA",
    body: "After release, the vehicle is inspected, issued Kenyan plates and a logbook. Only then is it legal on the road. Moving the car up from Mombasa is by road transporter or SGR rail.",
  },
];

const FAQS: Faq[] = [
  { q: "How old a car can I import into Kenya?", a: "Kenya bars vehicles more than eight years old, so a 2026 clearance means a 2019 vehicle or newer. The age is generally counted from first registration rather than manufacture, so a car built in 2018 but first registered in 2019 can still qualify. The vehicle must also be right-hand drive." },
  { q: "How much duty will I pay importing a car to Kenya?", a: "Five charges apply: import duty at 25 percent, excise at 20 percent for engines up to 1,500cc or 25 percent above that, VAT at 16 percent, an Import Declaration Fee of 3.5 percent and a Railway Development Levy of 2 percent. Because several compound, the total typically lands around 75 to 90 percent of the customs value." },
  { q: "Does KRA charge duty on the price I paid for the car?", a: "No. KRA assesses duty on the Current Retail Selling Price it publishes for that model, depreciated for age, rather than your purchase invoice. If the CRSP value is higher than what you paid, and it often is, duty is calculated on the higher figure." },
  { q: "Is RoRo or a container better for shipping a car to Kenya?", a: "RoRo is usually cheaper and simpler for a single running vehicle, which is driven aboard a dedicated car carrier. A container is worth it when shipping two or more cars, a non-runner, or when you want spare parts and personal effects loaded alongside the vehicle." },
  { q: "Do I need an inspection before shipping a car from Japan?", a: "Yes. Every vehicle must pass a pre-shipment roadworthiness and standards inspection in Japan under KEBS standard KS 1515:2000, carried out by a KEBS-appointed agent, typically costing 150 to 250 US dollars. Shipping without the certificate risks rejection at Mombasa at your cost." },
];

export default function ImportCarJapanKenyaPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="font-mono text-[11px] text-ink/50 hover:text-ink">
            ← All guides
          </Link>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide mt-4">
            Japan → Kenya · RoRo
          </p>
          <h1 className="font-display font-bold text-3xl mt-1 leading-tight">
            Importing a car from Japan to Mombasa
          </h1>
          <p className="text-ink/60 mt-3 max-w-2xl text-[15px] leading-relaxed">
            Japan supplies the overwhelming majority of Kenya&apos;s used-car imports, and the
            route is well worn. What catches people out is never the shipping — it is the
            tax stack, and the fact that <strong className="text-ink">KRA taxes a value it
            sets itself</strong>, not the price you paid. Here is the whole process, with
            the 2026 numbers.
          </p>

          {/* The duty stack */}
          <h2 className="font-display font-semibold text-2xl mt-10">What you actually pay</h2>
          <p className="text-ink/60 mt-2 text-[15px] leading-relaxed">
            Five separate charges apply, and three of them compound on each other. In
            practice the total lands somewhere around{" "}
            <strong className="text-ink">75–90% of the customs value</strong> — lower for
            small engines, higher for large ones.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2 pr-4">
                    Charge
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2 pr-4">
                    Rate
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2">
                    Charged on
                  </th>
                </tr>
              </thead>
              <tbody>
                {DUTIES.map((d) => (
                  <tr key={d.name} className="align-top">
                    <td className="border-t border-ink/10 py-3 pr-4">
                      <span className="font-semibold text-ink">{d.name}</span>
                    </td>
                    <td className="border-t border-ink/10 py-3 pr-4">
                      <span className="font-mono font-semibold text-sea">{d.rate}</span>
                    </td>
                    <td className="border-t border-ink/10 py-3">
                      <span className="text-ink/70">{d.base}</span>
                      <p className="text-ink/50 text-[13px] mt-0.5">{d.note}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl bg-parchment border border-ink/10 p-5">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-sea">
              The CRSP trap
            </p>
            <p className="text-[15px] text-ink/75 mt-1.5 leading-relaxed">
              Buying a cheap car in Japan does not necessarily mean cheap duty. KRA assesses
              against the Current Retail Selling Price for that model, depreciated for age.
              A bargain purchase and a standard CRSP produce the same tax bill. Always
              estimate duty from CRSP before committing to a purchase.
            </p>
          </div>

          {/* Process */}
          <h2 className="font-display font-semibold text-2xl mt-12">The process, step by step</h2>
          <div className="mt-5 space-y-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="font-display font-bold text-xl text-tide shrink-0">{s.n}</span>
                <div>
                  <h3 className="font-display font-semibold text-lg">{s.title}</h3>
                  <p className="text-ink/65 text-[15px] mt-1 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Practical notes */}
          <h2 className="font-display font-semibold text-2xl mt-12">Three things worth knowing</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink/70 leading-relaxed">
            <li>
              <strong className="text-ink">Hybrids are taxed far more kindly.</strong> The
              preferential 10% excise rate on hybrids and EVs, against 20–25% on petrol,
              changes the maths substantially on models like the Toyota Aqua, Nissan Note
              e-Power or Honda Fit Hybrid.
            </li>
            <li>
              <strong className="text-ink">Get a landed-cost quote, not a freight quote.</strong>{" "}
              A forwarder quoting only ocean freight is quoting perhaps a fifth of what you
              will spend. Ask for freight, inspection, clearing, port charges and duty
              estimate together.
            </li>
            <li>
              <strong className="text-ink">Rates and CRSP schedules change.</strong> Import
              duty moved from 35% to 25% in July 2025 and IDF rose to 3.5%; guides published
              before then are wrong. Confirm current figures with KRA or your clearing agent
              before budgeting.
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-12 rounded-2xl overflow-hidden border border-ink/10 grid sm:grid-cols-[1.3fr_1fr]">
            <div className="bg-ink text-paper p-7">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-saffron">
                Get it quoted properly
              </p>
              <h2 className="font-display font-bold text-xl mt-2">
                Compare forwarders who run the Japan–Mombasa lane
              </h2>
              <p className="text-sm text-paper/75 mt-2 leading-relaxed">
                Post the vehicle once and forwarders who actually handle RoRo into Mombasa
                come back with prices — including clearing, not just the sea leg.
              </p>
            </div>
            <div className="bg-paper p-7 flex flex-col justify-center gap-3">
              <Link
                href="/rfq/new"
                className="text-center bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-5 py-3"
              >
                Post your vehicle shipment
              </Link>
              <Link
                href="/directory?service=customs-brokerage"
                className="text-center border border-ink/20 hover:border-ink/50 transition text-ink font-medium text-sm rounded-lg px-5 py-3"
              >
                Browse clearing agents
              </Link>
            </div>
          </div>

          <p className="mt-8 font-mono text-[11px] text-ink/40 leading-relaxed">
            Figures current as of July 2026 and provided for general guidance only. Duty is
            assessed by KRA on the day of clearance and varies with CRSP valuation,
            exemptions and classification. Confirm with KRA or a licensed clearing agent
            before committing funds.
          </p>

          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Importing a car from Japan to Mombasa",
              description: "Kenya's 8-year rule, the full KRA duty stack on CRSP value, KEBS inspection, RoRo versus container, and clearing at Mombasa.",
              publisher: { "@type": "Organization", name: "PortiQuote" },
              mainEntityOfPage: `${SITE_URL}/guides/import-car-japan-kenya`,
            }}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
                { "@type": "ListItem", position: 2, name: "Importing a car from Japan to Mombasa", item: `${SITE_URL}/guides/import-car-japan-kenya` },
              ],
            }}
          />

          <FaqBlock faqs={FAQS} />
        </div>
      </main>
    </>
  );
}
