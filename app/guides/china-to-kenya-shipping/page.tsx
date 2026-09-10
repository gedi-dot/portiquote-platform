import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import FaqBlock, { type Faq } from "@/components/FaqBlock";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Shipping from China to Kenya — Routes, Costs & Clearance Guide",
  description:
    "How goods move from Guangzhou, Shenzhen, Shanghai and Ningbo to Mombasa and Nairobi: FCL vs LCL vs air, realistic transit times, the documents customs wants, and where importers lose money.",
  alternates: { canonical: "/guides/china-to-kenya-shipping" },
};

const OPTIONS = [
  {
    mode: "Ocean FCL",
    fit: "A full container of your own goods",
    transit: "Roughly 25–35 days port to port",
    note: "Cheapest per unit once you can fill a 20ft or 40ft box. You control loading, and the container is not opened until it reaches you.",
  },
  {
    mode: "Ocean LCL",
    fit: "A few pallets — too much for air, too little for a container",
    transit: "Roughly 30–45 days, plus consolidation time",
    note: "You share a container and pay by volume. Slower than FCL because cargo waits for consolidation at origin and deconsolidation at destination.",
  },
  {
    mode: "Air freight",
    fit: "Urgent, high-value, or light-but-valuable goods",
    transit: "Days rather than weeks",
    note: "Many times the cost of sea, but worth it when capital sits idle in transit or a product launch cannot wait.",
  },
];

const DOCS = [
  ["Commercial invoice", "Must match what is actually in the box. Undervaluing is the fastest route to a customs query and penalty."],
  ["Packing list", "Contents, weights, dimensions, carton counts."],
  ["Bill of lading / air waybill", "Your title to the goods. An original B/L is often needed for release."],
  ["Certificate of Conformity", "Kenya requires PVoC certification for most regulated goods — arranged before shipping, not after arrival."],
  ["Import Declaration Form", "Lodged through KRA before arrival."],
];

const FAQS: Faq[] = [
  { q: "How long does shipping from China to Kenya take?", a: "A full container typically runs 25 to 35 days port to port. Shared LCL cargo takes roughly 30 to 45 days because it waits for consolidation at origin and deconsolidation on arrival. Air freight moves in days. Most sailings tranship through a Gulf or Asian hub rather than going direct." },
  { q: "Which Chinese ports serve Kenya?", a: "Most Kenya-bound cargo leaves from the southern manufacturing belt, principally Shenzhen (Yantian) and Guangzhou (Nansha), or from Shanghai and Ningbo further north. Almost all of it arrives at Mombasa, then moves inland to Nairobi by SGR rail or road." },
  { q: "Should I ship FCL or LCL from China?", a: "Around 13 to 15 cubic metres, a 20ft container usually becomes cheaper than paying LCL rates by volume. Below that, sharing a container makes sense. Above it, ask for both prices, because many importers keep paying LCL long after a full container became the better deal." },
  { q: "What documents do I need to import from China into Kenya?", a: "A commercial invoice matching the actual contents, a packing list, the bill of lading or air waybill, a Certificate of Conformity under Kenya's PVoC programme for most regulated goods, and an Import Declaration Form lodged with KRA before arrival." },
  { q: "What is PVoC and when do I arrange it?", a: "PVoC is Kenya's Pre-Export Verification of Conformity programme. Certification is arranged in the country of export before shipping, not after arrival. Cargo that reaches Mombasa without it faces expensive destination-inspection routes or outright rejection." },
];

export default function ChinaToKenyaPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="font-mono text-[11px] text-ink/50 hover:text-ink">
            ← All guides
          </Link>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide mt-4">
            China → Kenya
          </p>
          <h1 className="font-display font-bold text-3xl mt-1 leading-tight">
            Shipping from China to Kenya
          </h1>
          <p className="text-ink/60 mt-3 max-w-2xl text-[15px] leading-relaxed">
            China is Kenya&apos;s largest source of imported goods, and the lane is
            competitive — which means a badly organised shipment costs far more than it
            should. Most of the money lost on this route is lost before the container
            sails, in the choice of shipping mode and the paperwork.
          </p>

          {/* Ports */}
          <h2 className="font-display font-semibold text-2xl mt-10">Where cargo leaves from</h2>
          <p className="text-ink/60 mt-2 text-[15px] leading-relaxed">
            Most Kenya-bound cargo departs from the southern manufacturing belt —{" "}
            <strong className="text-ink">Shenzhen (Yantian), Guangzhou (Nansha)</strong> and
            nearby ports — or from{" "}
            <strong className="text-ink">Shanghai and Ningbo</strong> further north. Almost
            everything arrives at <strong className="text-ink">Mombasa</strong>, then moves
            inland by SGR rail or road to Nairobi and the ICD.
          </p>
          <p className="text-ink/60 mt-3 text-[15px] leading-relaxed">
            Very little sails direct. Expect a transhipment, usually through a Gulf or Asian
            hub, which is normal and not a sign of a bad routing — but it does mean the
            quoted transit time is an estimate, not a guarantee.
          </p>

          {/* Options */}
          <h2 className="font-display font-semibold text-2xl mt-12">Choosing how to ship</h2>
          <div className="mt-5 space-y-4">
            {OPTIONS.map((o) => (
              <div key={o.mode} className="bg-paper border border-ink/10 rounded-xl p-5">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-display font-semibold text-lg">{o.mode}</h3>
                  <span className="font-mono text-[11px] text-ink/50">{o.transit}</span>
                </div>
                <p className="text-sm text-sea font-medium mt-1">{o.fit}</p>
                <p className="text-ink/65 text-[15px] mt-1.5 leading-relaxed">{o.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-parchment border border-ink/10 p-5">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-sea">
              The LCL break-even
            </p>
            <p className="text-[15px] text-ink/75 mt-1.5 leading-relaxed">
              Somewhere around 13–15 cubic metres, LCL stops being cheaper than a 20ft
              container. Below that, sharing is sensible. Above it, ask for both prices —
              many importers keep paying LCL rates long after a full container became the
              better deal.
            </p>
          </div>

          {/* Documents */}
          <h2 className="font-display font-semibold text-2xl mt-12">The documents customs wants</h2>
          <div className="mt-5 space-y-3">
            {DOCS.map(([name, why]) => (
              <div key={name} className="flex gap-3">
                <span className="text-tide font-mono text-sm mt-0.5">·</span>
                <p className="text-[15px] text-ink/70 leading-relaxed">
                  <strong className="text-ink">{name}</strong> — {why}
                </p>
              </div>
            ))}
          </div>

          {/* Pitfalls */}
          <h2 className="font-display font-semibold text-2xl mt-12">Where importers lose money</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink/70 leading-relaxed">
            <li>
              <strong className="text-ink">Arranging PVoC after shipping.</strong> Kenya
              requires conformity certification for most regulated goods, arranged in the
              country of export. Cargo that arrives without it faces expensive
              destination-inspection routes or rejection.
            </li>
            <li>
              <strong className="text-ink">Comparing quotes that are not comparable.</strong>{" "}
              One forwarder quotes port to port, another door to door. Always ask what the
              price excludes — local charges, THC, customs clearance, inland haulage and
              storage are where an apparently cheap quote catches up with you.
            </li>
            <li>
              <strong className="text-ink">Ignoring demurrage and storage.</strong> The clock
              starts when the container lands. Paperwork problems become daily charges very
              quickly, and they dwarf the savings from a slightly cheaper freight rate.
            </li>
            <li>
              <strong className="text-ink">Under-declaring value.</strong> It is a false
              economy. KRA values independently, and a query costs you far more in delay and
              penalty than the duty ever would have.
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-12 rounded-2xl overflow-hidden border border-ink/10 grid sm:grid-cols-[1.3fr_1fr]">
            <div className="bg-ink text-paper p-7">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-saffron">
                Get competing prices
              </p>
              <h2 className="font-display font-bold text-xl mt-2">
                Forwarders on the China–Kenya lane
              </h2>
              <p className="text-sm text-paper/75 mt-2 leading-relaxed">
                Describe the shipment once. Forwarders who run this corridor — at both ends
                — reply with prices you can compare side by side.
              </p>
            </div>
            <div className="bg-paper p-7 flex flex-col justify-center gap-3">
              <Link
                href="/rfq/new"
                className="text-center bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-5 py-3"
              >
                Post your shipment
              </Link>
              <Link
                href="/countries/cn"
                className="text-center border border-ink/20 hover:border-ink/50 transition text-ink font-medium text-sm rounded-lg px-5 py-3"
              >
                Forwarders in China
              </Link>
            </div>
          </div>

          <p className="mt-8 font-mono text-[11px] text-ink/40 leading-relaxed">
            Transit times are typical ranges, not guarantees — actual schedules depend on
            carrier, transhipment and season. Confirm regulatory requirements with KEBS and
            KRA before shipping.
          </p>

          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Shipping from China to Kenya",
              description: "Origin ports, realistic transit times, FCL versus LCL versus air, the documents customs wants, and where importers lose money.",
              publisher: { "@type": "Organization", name: "PortiQuote" },
              mainEntityOfPage: `${SITE_URL}/guides/china-to-kenya-shipping`,
            }}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
                { "@type": "ListItem", position: 2, name: "Shipping from China to Kenya", item: `${SITE_URL}/guides/china-to-kenya-shipping` },
              ],
            }}
          />

          <FaqBlock faqs={FAQS} />
        </div>
      </main>
    </>
  );
}
