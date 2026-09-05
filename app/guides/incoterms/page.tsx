import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "Incoterms 2020 Explained" };

const TERMS = [
  { code: "EXW", name: "Ex Works", risk: "Seller's premises", freight: "Buyer", mode: "Any", note: "Buyer does everything, including export clearance. Heaviest burden on the buyer." },
  { code: "FCA", name: "Free Carrier", risk: "Handover to buyer's carrier", freight: "Buyer", mode: "Any", note: "The workhorse for containerised trade. Seller clears export." },
  { code: "CPT", name: "Carriage Paid To", risk: "Handover to first carrier", freight: "Seller", mode: "Any", note: "Seller pays freight, but risk passes early — insure accordingly." },
  { code: "CIP", name: "Carriage & Insurance Paid", risk: "Handover to first carrier", freight: "Seller", mode: "Any", note: "Like CPT plus seller buys all-risk insurance (ICC A) since 2020." },
  { code: "DAP", name: "Delivered At Place", risk: "Named destination, on truck", freight: "Seller", mode: "Any", note: "Buyer handles import clearance and duties." },
  { code: "DPU", name: "Delivered at Place Unloaded", risk: "Named destination, unloaded", freight: "Seller", mode: "Any", note: "Only term where the seller unloads. New name in 2020 (was DAT)." },
  { code: "DDP", name: "Delivered Duty Paid", risk: "Named destination", freight: "Seller", mode: "Any", note: "Seller even pays import duty & VAT. Heaviest burden on the seller." },
  { code: "FAS", name: "Free Alongside Ship", risk: "Alongside vessel at load port", freight: "Buyer", mode: "Sea only", note: "Mostly bulk & break-bulk cargo." },
  { code: "FOB", name: "Free On Board", risk: "On board vessel at load port", freight: "Buyer", mode: "Sea only", note: "East Africa's favourite. Not meant for containers (use FCA) but widely used anyway." },
  { code: "CFR", name: "Cost & Freight", risk: "On board vessel at load port", freight: "Seller", mode: "Sea only", note: "Seller pays ocean freight; risk still passes at loading." },
  { code: "CIF", name: "Cost, Insurance & Freight", risk: "On board vessel at load port", freight: "Seller", mode: "Sea only", note: "CFR plus minimum-cover insurance (ICC C). Common for LC payments." },
];

export default function IncotermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="font-mono text-[11px] text-ink/50 hover:text-ink">← All guides</Link>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide mt-4">Commercial terms</p>
          <h1 className="font-display font-bold text-3xl mt-1">Incoterms 2020, explained</h1>
          <p className="text-ink/60 mt-2 max-w-2xl text-[15px]">
            Incoterms decide two things: <strong className="text-ink">who pays for which leg</strong> and{" "}
            <strong className="text-ink">where risk transfers</strong> from seller to buyer. Those are
            different points — a seller can pay the freight while the buyer already carries the risk.
            That single misunderstanding causes most Incoterm disputes.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2 pr-4">Term</th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2 pr-4">Risk transfers at</th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2 pr-4">Main freight paid by</th>
                  <th className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 pb-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {TERMS.map((t) => (
                  <tr key={t.code} className="align-top">
                    <td className="border-t border-ink/10 py-3 pr-4">
                      <span className="font-mono font-semibold text-sea">{t.code}</span>
                      <span className="block text-xs text-ink/55">{t.name}</span>
                      <span className="block text-xs text-ink/50 mt-1 max-w-[240px]">{t.note}</span>
                    </td>
                    <td className="border-t border-ink/10 py-3 pr-4 text-ink/75">{t.risk}</td>
                    <td className="border-t border-ink/10 py-3 pr-4 text-ink/75">{t.freight}</td>
                    <td className="border-t border-ink/10 py-3 font-mono text-xs text-ink/60">{t.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 bg-parchment border border-ink/10 rounded-xl p-5 text-sm text-ink/70">
            <p className="font-display font-semibold text-ink">Rules of thumb from the desk</p>
            <p className="mt-2">
              Importing into East Africa? <span className="font-mono text-sea">FOB</span> keeps you in
              control of ocean freight and avoids inflated <span className="font-mono text-sea">CIF</span>{" "}
              markups. Shipping containers, not bulk? The ICC says use{" "}
              <span className="font-mono text-sea">FCA</span> instead of FOB — risk shouldn&apos;t wait
              until the container is lifted on board when you handed it over at the terminal days earlier.
              And under <span className="font-mono text-sea">CPT/CFR</span>, remember the seller paying
              freight does not mean the seller carries the risk in transit — buy insurance.
            </p>
          </div>

          <div className="mt-6 text-sm text-ink/60">
            Ready to put a term on a real shipment?{" "}
            <Link href="/rfq/new" className="text-sea font-semibold underline decoration-saffron/60">Post an RFQ</Link>{" "}
            and let forwarders quote against it.
          </div>
        </div>
      </main>
    </>
  );
}
