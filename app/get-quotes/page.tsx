import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Get Free Freight Quotes — Compare Forwarders in 24 Hours",
  description:
    "Importing into Kenya? Tell us what you're shipping and get competing quotes from vetted freight forwarders — free, no obligation. Ocean, air, road and vehicle imports.",
  alternates: { canonical: "/get-quotes" },
};

const STEPS = [
  ["01", "Tell us what you're shipping", "Where from, where to, and roughly what it is. Two minutes."],
  ["02", "Forwarders quote you", "Vetted forwarders who actually run your route reply with prices and transit times."],
  ["03", "You choose — or don't", "Compare side by side and deal directly with whoever you like. No obligation, no fee to you."],
];

const CARGO = [
  ["Vehicles from Japan or the UK", "RoRo and container, Mombasa clearance included"],
  ["Containers from China", "Guangzhou, Shenzhen, Shanghai and Ningbo — FCL and LCL"],
  ["Goods from Dubai", "Fast turnaround on the Jebel Ali corridor"],
  ["Air freight, anywhere", "Urgent or high-value cargo"],
  ["Exports out of Kenya", "Tea, produce, flowers and general cargo"],
  ["Regional road freight", "Uganda, Tanzania, Rwanda, South Sudan, DRC"],
];

export default function GetQuotesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-mist">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ background: "radial-gradient(130% 130% at 15% 0%, #0B4A54 0%, #062A2E 100%)" }}
        >
          <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-saffron">
              Free · no obligation
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-5xl text-paper mt-3 max-w-2xl leading-tight">
              Get freight quotes without ringing round.
            </h1>
            <p className="text-paper/75 mt-4 max-w-xl text-[16px] leading-relaxed">
              Tell us what you&apos;re shipping. Vetted forwarders who run your route come
              back with prices — usually within a day. Comparing costs you nothing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rfq/new"
                className="bg-saffron hover:brightness-95 transition text-ink font-semibold text-[15px] rounded-lg px-7 py-4"
              >
                Get my quotes →
              </Link>
              <Link
                href="/directory"
                className="border border-paper/40 hover:border-paper/80 transition text-paper font-medium text-[15px] rounded-lg px-7 py-4"
              >
                Browse forwarders
              </Link>
            </div>
            <p className="font-mono text-[11px] text-paper/55 mt-7">
              Ocean · air · road · RoRo — Kenya and worldwide
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(([n, title, body]) => (
              <div key={n}>
                <span className="font-display font-bold text-2xl text-tide">{n}</span>
                <h2 className="font-display font-semibold text-lg mt-1">{title}</h2>
                <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we quote */}
        <section className="bg-paper border-y border-ink/10">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-sea">
              What we can quote
            </p>
            <h2 className="font-display font-bold text-2xl mt-2">
              If it moves, someone here ships it
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
              {CARGO.map(([title, note]) => (
                <div key={title} className="border border-ink/10 rounded-xl p-5">
                  <h3 className="font-display font-semibold text-[15px]">{title}</h3>
                  <p className="text-sm text-ink/55 mt-1 leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why free */}
        <section className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid sm:grid-cols-2 gap-8 items-start">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-sea">
                Why it&apos;s free
              </p>
              <h2 className="font-display font-bold text-2xl mt-2">
                Shippers never pay us. Forwarders do.
              </h2>
              <p className="text-ink/65 mt-3 text-[15px] leading-relaxed">
                Forwarders pay for membership so they can reach cargo owners like you.
                That&apos;s the whole business model — which means posting a shipment and
                comparing quotes costs you nothing, ever, and there is no commission buried
                in the rates you&apos;re given.
              </p>
            </div>
            <div className="bg-paper border border-ink/10 rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg">What you get</h3>
              <ul className="mt-3 space-y-2.5 text-[15px] text-ink/70">
                <li className="flex gap-2.5">
                  <span className="text-tide">·</span> Competing prices, not one opinion
                </li>
                <li className="flex gap-2.5">
                  <span className="text-tide">·</span> Transit times and validity dates in writing
                </li>
                <li className="flex gap-2.5">
                  <span className="text-tide">·</span> Each forwarder&apos;s contact details, so you deal direct
                </li>
                <li className="flex gap-2.5">
                  <span className="text-tide">·</span> Ratings from other shippers
                </li>
                <li className="flex gap-2.5">
                  <span className="text-tide">·</span> No obligation to book anyone
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Guides cross-link — feeds the SEO articles */}
        <section className="bg-parchment border-y border-ink/10">
          <div className="mx-auto max-w-5xl px-5 py-12">
            <h2 className="font-display font-bold text-xl">Working out costs first?</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-5">
              <Link
                href="/guides/import-car-japan-kenya"
                className="group bg-paper border border-ink/10 rounded-xl p-5 hover:border-tide/50 transition"
              >
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-tide">
                  Japan → Kenya
                </p>
                <h3 className="font-display font-semibold text-[15px] mt-1 group-hover:text-sea transition">
                  Importing a car from Japan
                </h3>
                <p className="text-sm text-ink/55 mt-1">The full duty stack and the CRSP trap.</p>
              </Link>
              <Link
                href="/guides/china-to-kenya-shipping"
                className="group bg-paper border border-ink/10 rounded-xl p-5 hover:border-tide/50 transition"
              >
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-tide">
                  China → Kenya
                </p>
                <h3 className="font-display font-semibold text-[15px] mt-1 group-hover:text-sea transition">
                  Shipping from China
                </h3>
                <p className="text-sm text-ink/55 mt-1">Modes, documents and costly mistakes.</p>
              </Link>
              <Link
                href="/guides/fcl-vs-lcl"
                className="group bg-paper border border-ink/10 rounded-xl p-5 hover:border-tide/50 transition"
              >
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-tide">
                  Ocean freight
                </p>
                <h3 className="font-display font-semibold text-[15px] mt-1 group-hover:text-sea transition">
                  FCL vs LCL
                </h3>
                <p className="text-sm text-ink/55 mt-1">Which is actually cheaper for you.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-5xl px-5 py-16 text-center">
          <h2 className="font-display font-bold text-2xl sm:text-3xl">
            Ready to see what your shipment costs?
          </h2>
          <p className="text-ink/60 mt-2 max-w-lg mx-auto text-[15px]">
            Two minutes to post. Quotes usually start arriving the same day.
          </p>
          <Link
            href="/rfq/new"
            className="inline-block mt-6 bg-saffron hover:brightness-95 transition text-ink font-semibold text-[15px] rounded-lg px-8 py-4"
          >
            Get my quotes →
          </Link>
        </section>
      </main>
    </>
  );
}
