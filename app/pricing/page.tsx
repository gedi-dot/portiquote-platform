import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "Pricing — GasDi Caravan" };

const FREE = [
  "Company listing in the directory",
  "Public profile with services & trade lanes",
  "Collect reviews from shippers",
  "Appear in country pages",
];
const PREMIUM = [
  "Everything in Free",
  "Receive RFQ leads on your lanes by email",
  "Submit quotes and win jobs",
  "Rank above free listings in every search",
  "Premium badge on your profile",
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide">Membership</p>
          <h1 className="font-display font-bold text-3xl mt-1">Simple pricing, built for African forwarders</h1>
          <p className="text-ink/60 mt-2 max-w-xl">
            Shippers post RFQs for free — always. Forwarders choose how visible they want to be.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            <div className="bg-paper border border-ink/10 rounded-2xl p-6">
              <h2 className="font-display font-semibold text-xl">Free listing</h2>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="font-display font-bold text-3xl">KES 0</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-ink/75">
                {FREE.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-tide mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/forwarders/new" className="block text-center mt-6 border border-sea/30 text-sea font-semibold text-sm rounded-lg py-2.5 hover:bg-mist transition">
                List your company
              </Link>
            </div>

            <div className="bg-paper border border-saffron/40 ring-1 ring-saffron/20 rounded-2xl p-6 relative">
              <span className="absolute -top-2.5 left-5 font-mono text-[9px] tracking-[0.18em] uppercase text-ink bg-saffron rounded px-2 py-0.5">
                Most popular
              </span>
              <h2 className="font-display font-semibold text-xl">Premium</h2>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="font-mono text-[11px] uppercase text-ink/45">KES</span>
                <span className="font-display font-bold text-3xl">2,500</span>
                <span className="text-ink/50 text-sm">/ month</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-ink/75">
                {PREMIUM.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-tide mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/upgrade" className="block text-center mt-6 bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-2.5">
                Go Premium
              </Link>
              <p className="text-xs text-ink/45 mt-2.5 text-center">30 days per payment · cancel anytime by not renewing</p>
            </div>
          </div>

          <div className="mt-10 bg-parchment border border-ink/10 rounded-2xl p-6">
            <h3 className="font-display font-semibold text-lg">Why Premium pays for itself</h3>
            <p className="text-sm text-ink/70 mt-2 max-w-2xl">
              One won shipment typically covers months of membership. Premium members are notified
              the moment a shipper posts on their lane — and early quotes win most jobs. The quote
              button is enforced in the database itself: only Premium members can submit.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
