import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide">About</p>
          <h1 className="font-display font-bold text-3xl mt-1">Rooted in Africa. Moving cargo worldwide.</h1>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/75">
            <p>
              GassDi Caravan is a freight forwarder marketplace built in Nairobi. Shippers post a
              consignment once; vetted forwarders across Africa compete for it with priced quotes —
              ocean, air, road, and RoRo, on lanes reaching Europe, Asia, the Gulf, and the Americas.
            </p>
            <p>
              A caravan is how goods have always moved: many traders on one route,
              travelling together because nobody crosses the distance alone. Every
              shipment needs the right forwarder — one who actually runs that lane,
              knows that port, and clears that cargo. Finding them usually means
              ringing round for days. Here you describe the cargo once, and the
              forwarders who genuinely cover your route come to you with prices.
            </p>
            <p>
              The platform was founded by a freight operations professional with years of hands-on
              forwarding experience across East African corridors — Incoterms negotiated, RoRo
              bookings made, IMDG declarations filed, and demurrage fought over. It is built for
              the way African freight actually works, including M-Pesa as a first-class payment rail.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <div className="bg-paper border border-ink/10 rounded-xl p-4">
              <p className="font-display font-bold text-xl">151</p>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mt-0.5">Countries covered</p>
            </div>
            <div className="bg-paper border border-ink/10 rounded-xl p-4">
              <p className="font-display font-bold text-xl">54</p>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mt-0.5">African states</p>
            </div>
            <div className="bg-paper border border-ink/10 rounded-xl p-4">
              <p className="font-display font-bold text-xl">4</p>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mt-0.5">Freight modes</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/forwarders/new" className="bg-sea text-paper font-semibold text-sm rounded-lg px-5 py-2.5">
              List your company
            </Link>
            <Link href="/contact" className="border border-sea/30 text-sea font-semibold text-sm rounded-lg px-5 py-2.5">
              Get in touch
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
