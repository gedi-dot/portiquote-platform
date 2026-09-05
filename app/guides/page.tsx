import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "Freight Guides" };

const GUIDES = [
  {
    href: "/guides/import-car-japan-kenya",
    tag: "Japan → Kenya · RoRo",
    title: "Importing a car from Japan to Mombasa",
    blurb: "The 8-year rule, the full KRA duty stack on CRSP value, KEBS inspection, and why cheap cars don't mean cheap duty.",
  },
  {
    href: "/guides/china-to-kenya-shipping",
    tag: "China → Kenya",
    title: "Shipping from China to Kenya",
    blurb: "Ports, realistic transit times, FCL vs LCL vs air, the documents customs wants, and where importers lose money.",
  },
  {
    href: "/guides/fcl-vs-lcl",
    tag: "Ocean freight",
    title: "FCL vs LCL: which should you ship?",
    blurb: "The volume break-even, the destination charges LCL quotes leave out, and a simple rule for deciding.",
  },
  {
    href: "/guides/incoterms",
    tag: "Commercial terms",
    title: "Incoterms 2020, explained",
    blurb: "All 11 terms — who pays, who insures, and exactly where risk transfers from seller to buyer.",
  },
  {
    href: "/guides/container-specifications",
    tag: "Equipment",
    title: "Container specifications",
    blurb: "20GP to 45HC and reefers: internal dimensions, door openings, max payload, and capacity in CBM.",
  },
  {
    href: "/guides/imdg-classes",
    tag: "Dangerous goods",
    title: "IMDG hazard classes",
    blurb: "The 9 classes of dangerous goods at sea, common examples, and what forwarders need from you.",
  },
];

export default function GuidesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide">Resources</p>
          <h1 className="font-display font-bold text-3xl mt-1">Freight guides</h1>
          <p className="text-ink/60 mt-2 max-w-xl">
            Practical references written from the operations desk — the things shippers ask
            forwarders every day.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href}
                className="group bg-paper border border-ink/10 rounded-xl p-5 hover:border-tide/50 transition flex flex-col">
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-tide">{g.tag}</span>
                <h2 className="font-display font-semibold text-lg mt-1.5 group-hover:text-sea transition">{g.title}</h2>
                <p className="text-sm text-ink/60 mt-2 flex-1">{g.blurb}</p>
                <span className="font-mono text-[11px] text-saffron mt-4">Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
