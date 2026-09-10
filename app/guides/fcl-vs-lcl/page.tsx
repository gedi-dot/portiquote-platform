import Link from "next/link";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import FaqBlock, { type Faq } from "@/components/FaqBlock";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "FCL vs LCL — Which Should You Ship?",
  description:
    "Full container or shared? The volume break-even, the hidden costs of LCL, transit-time differences, and a simple rule for deciding — with worked reasoning for African import lanes.",
  alternates: { canonical: "/guides/fcl-vs-lcl" },
};

const COMPARE = [
  ["Billed on", "The container, whatever you put in it", "Volume (CBM) or weight, whichever is greater"],
  ["Best for", "Roughly 13 CBM and above", "A few pallets — under about 13 CBM"],
  ["Transit", "Faster — no consolidation wait", "Slower — waits for co-loaders at both ends"],
  ["Handling", "Sealed at origin, opened by you", "Loaded and unloaded alongside other cargo"],
  ["Damage risk", "Lower — nobody else touches it", "Higher — more handling, neighbouring cargo"],
  ["Destination charges", "Fewer, more predictable", "Deconsolidation and handling fees add up"],
];

const FAQS: Faq[] = [
  { q: "What is the difference between FCL and LCL?", a: "FCL means you buy an entire container and fill it with your own goods, sealed at origin and opened by you. LCL means you rent space inside a container shared with other importers, billed by volume or weight, and handled alongside their cargo at both ends." },
  { q: "At what volume does FCL become cheaper than LCL?", a: "Usually somewhere around 13 to 15 cubic metres. A 20ft container holds roughly 28 to 33 cubic metres in practice, so below the break-even sharing is sensible, and above it a container you control often beats a full LCL booking even when partly empty." },
  { q: "Why does LCL cost more than the quoted rate?", a: "LCL freight rates exclude destination charges. Deconsolidation, handling, documentation and terminal fees are billed on arrival per shipment rather than per cubic metre, which is why a small LCL consignment can carry a bill that is large relative to its size." },
  { q: "Is LCL slower than FCL?", a: "Yes. LCL waits for co-loading cargo to fill the container at origin and for deconsolidation on arrival, typically adding a week or more compared with a full container on the same sailing." },
];

export default function FclVsLclPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="font-mono text-[11px] text-ink/50 hover:text-ink">
            ← All guides
          </Link>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide mt-4">
            Ocean freight
          </p>
          <h1 className="font-display font-bold text-3xl mt-1 leading-tight">
            FCL vs LCL: which should you ship?
          </h1>
          <p className="text-ink/60 mt-3 max-w-2xl text-[15px] leading-relaxed">
            FCL means you buy a whole container. LCL means you rent space in someone
            else&apos;s. The choice looks like a simple cost question and usually is not —
            because the cheaper freight rate is not always the cheaper shipment.
          </p>

          {/* Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2 pr-4"></th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-sea pb-2 pr-4">
                    FCL
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron pb-2">
                    LCL
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, fcl, lcl]) => (
                  <tr key={label} className="align-top">
                    <td className="border-t border-ink/10 py-3 pr-4 font-semibold text-ink whitespace-nowrap">
                      {label}
                    </td>
                    <td className="border-t border-ink/10 py-3 pr-4 text-ink/70">{fcl}</td>
                    <td className="border-t border-ink/10 py-3 text-ink/70">{lcl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The rule */}
          <div className="mt-8 rounded-xl bg-parchment border border-ink/10 p-5">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-sea">
              The simple rule
            </p>
            <p className="text-[15px] text-ink/75 mt-1.5 leading-relaxed">
              A 20ft container holds around 28–33 CBM in practice. Somewhere near{" "}
              <strong className="text-ink">13–15 CBM</strong>, the per-cubic-metre cost of
              LCL usually overtakes the flat cost of a 20ft box. Below that, share. Above it,
              ask for both quotes — and remember a half-empty container you control can beat
              a full LCL booking you do not.
            </p>
          </div>

          {/* Hidden costs */}
          <h2 className="font-display font-semibold text-2xl mt-12">
            Why LCL costs more than the quote says
          </h2>
          <p className="text-ink/60 mt-2 text-[15px] leading-relaxed">
            LCL freight rates look attractive because the destination charges are not in
            them. Deconsolidation, handling, documentation and terminal fees are billed at
            arrival, per shipment rather than per cubic metre — which is why a small LCL
            consignment can carry a surprisingly large bill relative to its size.
          </p>
          <p className="text-ink/60 mt-3 text-[15px] leading-relaxed">
            The fix is not to avoid LCL. It is to insist that every quote you compare is an{" "}
            <strong className="text-ink">all-in landed figure</strong> — freight, origin
            charges, destination charges, clearance and delivery. A forwarder who cannot
            give you that is quoting you one leg of a journey.
          </p>

          {/* Decide */}
          <h2 className="font-display font-semibold text-2xl mt-12">Deciding in practice</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink/70 leading-relaxed">
            <li>
              <strong className="text-ink">Choose FCL</strong> when your volume is near the
              break-even, your cargo is fragile or high-value, timing matters, or you are
              importing regularly enough that predictability is worth paying for.
            </li>
            <li>
              <strong className="text-ink">Choose LCL</strong> for genuinely small
              consignments, first test orders, or when you would otherwise tie up capital
              sitting on stock just to fill a box.
            </li>
            <li>
              <strong className="text-ink">Consider consolidating</strong> — if you buy from
              several suppliers in one region, a forwarder can gather the orders and ship
              them as one FCL, which often beats several separate LCL bookings.
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-12 rounded-2xl overflow-hidden border border-ink/10 grid sm:grid-cols-[1.3fr_1fr]">
            <div className="bg-ink text-paper p-7">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-saffron">
                Not sure which is cheaper?
              </p>
              <h2 className="font-display font-bold text-xl mt-2">
                Post it once and get both prices
              </h2>
              <p className="text-sm text-paper/75 mt-2 leading-relaxed">
                Describe the cargo and let forwarders quote FCL and LCL side by side. The
                comparison is a great deal easier when the numbers are in front of you.
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
                href="/guides/container-specifications"
                className="text-center border border-ink/20 hover:border-ink/50 transition text-ink font-medium text-sm rounded-lg px-5 py-3"
              >
                Container dimensions
              </Link>
            </div>
          </div>

          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "FCL vs LCL: which should you ship?",
              description: "The volume break-even, the destination charges LCL quotes leave out, and a simple rule for deciding.",
              publisher: { "@type": "Organization", name: "PortiQuote" },
              mainEntityOfPage: `${SITE_URL}/guides/fcl-vs-lcl`,
            }}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
                { "@type": "ListItem", position: 2, name: "FCL vs LCL: which should you ship?", item: `${SITE_URL}/guides/fcl-vs-lcl` },
              ],
            }}
          />

          <FaqBlock faqs={FAQS} />
        </div>
      </main>
    </>
  );
}
