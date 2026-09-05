import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "IMDG Hazard Classes" };

const CLASSES = [
  { n: "1", name: "Explosives", ex: "Fireworks, ammunition, blasting agents" },
  { n: "2", name: "Gases", ex: "LPG, oxygen cylinders, aerosols, refrigerant gas" },
  { n: "3", name: "Flammable liquids", ex: "Petrol, ethanol, paints, adhesives, perfumery" },
  { n: "4", name: "Flammable solids", ex: "Matches, sulphur, charcoal, self-reactive substances" },
  { n: "5", name: "Oxidisers & organic peroxides", ex: "Ammonium nitrate fertiliser, pool chlorine, hydrogen peroxide" },
  { n: "6", name: "Toxic & infectious substances", ex: "Pesticides, cyanides, clinical waste, lab specimens" },
  { n: "7", name: "Radioactive material", ex: "Medical isotopes, industrial gauges, uranium ores" },
  { n: "8", name: "Corrosives", ex: "Sulphuric acid, caustic soda, wet-cell batteries" },
  { n: "9", name: "Miscellaneous", ex: "Lithium batteries, dry ice, vehicles with fuel, magnetised material" },
];

export default function IMDGPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="font-mono text-[11px] text-ink/50 hover:text-ink">← All guides</Link>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide mt-4">Dangerous goods</p>
          <h1 className="font-display font-bold text-3xl mt-1">IMDG hazard classes</h1>
          <p className="text-ink/60 mt-2 max-w-2xl text-[15px]">
            The IMDG Code governs dangerous goods at sea. Every DG shipment needs a UN number, proper
            shipping name, class, and packing group — declared before booking, not at the port gate.
            Class 9 catches more everyday cargo than shippers expect: lithium batteries and vehicles
            with fuel in the tank both count.
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            {CLASSES.map((c) => (
              <div key={c.n} className="bg-paper border border-ink/10 rounded-xl p-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-sea text-paper font-mono font-semibold grid place-items-center">{c.n}</span>
                  <p className="font-display font-semibold text-[15px] leading-tight">{c.name}</p>
                </div>
                <p className="text-xs text-ink/55 mt-2.5">{c.ex}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-parchment border border-ink/10 rounded-xl p-5 text-sm text-ink/70">
            <p className="font-display font-semibold text-ink">What your forwarder will ask for</p>
            <p className="mt-2">
              The Material Safety Data Sheet (MSDS/SDS), the UN number and packing group, and a signed
              Dangerous Goods Declaration. Expect a DG surcharge, longer booking lead times, and some
              carriers refusing certain classes on certain lanes entirely. Undeclared DG is the fastest
              way to fines, rolled bookings, and a blacklisted shipper account — declare it and let a
              forwarder who handles hazmat quote it properly.
            </p>
          </div>

          <div className="mt-6 text-sm text-ink/60">
            Shipping hazmat?{" "}
            <Link href="/rfq/new" className="text-sea font-semibold underline decoration-saffron/60">Post the RFQ</Link>{" "}
            and toggle the IMDG flag — only forwarders comfortable with your class will quote.
          </div>
        </div>
      </main>
    </>
  );
}
