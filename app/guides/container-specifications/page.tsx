import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "Container Specifications — N.K. Gedi & Co." };

const BOXES = [
  { type: "20GP", name: "20' General Purpose", inside: "5.90 × 2.35 × 2.39 m", door: "2.34 × 2.28 m", payload: "~28,200 kg", cbm: "33 m³", use: "Dense cargo: tiles, rice, machinery parts, drums." },
  { type: "40GP", name: "40' General Purpose", inside: "12.03 × 2.35 × 2.39 m", door: "2.34 × 2.28 m", payload: "~26,600 kg", cbm: "67 m³", use: "The default box for general containerised cargo." },
  { type: "40HC", name: "40' High Cube", inside: "12.03 × 2.35 × 2.69 m", door: "2.34 × 2.58 m", payload: "~26,500 kg", cbm: "76 m³", use: "Volume cargo: furniture, textiles, light manufactured goods." },
  { type: "40RF", name: "40' Reefer (High Cube)", inside: "11.56 × 2.29 × 2.55 m", door: "2.29 × 2.57 m", payload: "~27,700 kg", cbm: "67 m³", use: "Perishables: flowers, avocados, fish, pharma. Set-point ±0.25 °C." },
  { type: "45HC", name: "45' High Cube", inside: "13.55 × 2.35 × 2.69 m", door: "2.34 × 2.58 m", payload: "~27,900 kg", cbm: "86 m³", use: "Maximum volume for light cargo where the lane allows it." },
];

export default function ContainerSpecsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="font-mono text-[11px] text-ink/50 hover:text-ink">← All guides</Link>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide mt-4">Equipment</p>
          <h1 className="font-display font-bold text-3xl mt-1">Container specifications</h1>
          <p className="text-ink/60 mt-2 max-w-2xl text-[15px]">
            Internal dimensions and payloads vary slightly by manufacturer — treat these as planning
            figures and confirm with your forwarder before a tight stow. Road legal limits on your
            corridor often bite before the container&apos;s own max payload does.
          </p>

          <div className="mt-8 space-y-4">
            {BOXES.map((b) => (
              <div key={b.type} className="bg-paper border border-ink/10 rounded-xl p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono font-semibold text-sea text-lg">{b.type}</span>
                  <span className="font-display font-semibold">{b.name}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mt-4 text-sm">
                  <div><p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Internal L×W×H</p><p className="font-mono text-[13px] mt-0.5">{b.inside}</p></div>
                  <div><p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Door W×H</p><p className="font-mono text-[13px] mt-0.5">{b.door}</p></div>
                  <div><p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Max payload</p><p className="font-mono text-[13px] mt-0.5">{b.payload}</p></div>
                  <div><p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40">Capacity</p><p className="font-mono text-[13px] mt-0.5">{b.cbm}</p></div>
                </div>
                <p className="text-sm text-ink/60 mt-3">{b.use}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-parchment border border-ink/10 rounded-xl p-5 text-sm text-ink/70">
            <p className="font-display font-semibold text-ink">Quick sizing rule</p>
            <p className="mt-2">
              Under ~28 m³ and heavy → <span className="font-mono text-sea">20GP</span>. Up to ~60 m³
              of mixed cargo → <span className="font-mono text-sea">40GP</span>. Light and bulky →{" "}
              <span className="font-mono text-sea">40HC</span>. Between a full 20&apos; and ~12–13 m³,
              compare FCL vs LCL pricing — LCL per-CBM rates plus destination charges often overtake
              a small FCL sooner than people expect.
            </p>
          </div>

          <div className="mt-6 text-sm text-ink/60">
            Know your box?{" "}
            <Link href="/rfq/new" className="text-sea font-semibold underline decoration-saffron/60">Post the shipment</Link>{" "}
            with container type and count — quotes come back sharper.
          </div>
        </div>
      </main>
    </>
  );
}
