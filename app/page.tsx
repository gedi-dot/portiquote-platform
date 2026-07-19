import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Arcs() {
  return (
    <svg viewBox="0 0 460 360" fill="none" className="h-full w-auto" aria-hidden="true">
      <circle cx="120" cy="230" r="10" stroke="#F2A83B" strokeWidth="2" />
      <circle cx="120" cy="230" r="3.5" fill="#FBFCFB" />
      {[
        "M120 230 C 200 60, 330 60, 420 90",
        "M120 230 C 220 130, 350 150, 440 200",
        "M120 230 C 210 300, 330 320, 430 300",
        "M120 230 C 150 120, 90 80, 40 60",
      ].map((d, i) => (
        <path key={i} d={d} stroke="#F2A83B" strokeWidth="2" opacity={0.85 - i * 0.15} strokeLinecap="round" />
      ))}
      {[[420, 90],[440, 200],[430, 300],[40, 60]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="#F2A83B" />
      ))}
    </svg>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ count: fwdCount }, { count: unclaimedCount }] = await Promise.all([
    supabase.from("forwarder_companies").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("forwarder_companies").select("id", { count: "exact", head: true }).eq("is_published", true).eq("is_claimed", false),
  ]);
  const forwarders = fwdCount ?? 0;
  const unclaimed = unclaimedCount ?? 0;

  return (
    <main className="min-h-screen bg-mist">
      <Navbar />

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden" style={{ background: "radial-gradient(130% 130% at 15% 0%, #0B4A54 0%, #062A2E 100%)" }}>
        <div className="absolute right-[-40px] top-0 h-full w-[55%] opacity-70 pointer-events-none hidden sm:block">
          <Arcs />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-saffron">
            Freight forwarder marketplace
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-paper mt-3 max-w-xl leading-tight">
            Rooted in Africa. Moving cargo worldwide.
          </h1>
          <p className="text-paper/75 mt-4 max-w-lg text-[15px] leading-relaxed">
            Post a shipment once and let vetted forwarders compete for it — ocean, air,
            road and RoRo across every major African gateway.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-6 py-3.5">
              Join free — list your company
            </Link>
            <Link href="/directory" className="border border-paper/40 hover:border-paper/80 transition text-paper font-medium text-sm rounded-lg px-6 py-3.5">
              Find a forwarder
            </Link>
          </div>
          <p className="font-mono text-[11px] text-paper/55 mt-8">
            {forwarders} forwarders listed · 54 African countries · ocean · air · road · RoRo
          </p>
        </div>
      </section>

      {/* ---- Two doors ---- */}
      <section className="mx-auto max-w-6xl px-5 -mt-8 relative grid sm:grid-cols-2 gap-4">
        <div className="bg-paper border border-ink/10 rounded-2xl p-6 shadow-sm">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-sea">I need to ship something</p>
          <h2 className="font-display font-semibold text-xl mt-1.5">Get competing quotes, free</h2>
          <p className="text-sm text-ink/60 mt-2">
            Describe your cargo once. Forwarders on your lane reply with priced quotes —
            compare side by side, message them, accept the best.
          </p>
          <Link href="/rfq/new" className="inline-block mt-4 bg-sea hover:brightness-110 transition text-paper font-semibold text-sm rounded-lg px-5 py-2.5">
            Post a shipment →
          </Link>
        </div>
        <div className="bg-paper border border-saffron/50 rounded-2xl p-6 shadow-sm">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">I&apos;m a freight forwarder</p>
          <h2 className="font-display font-semibold text-xl mt-1.5">Get found. Get leads. Win jobs.</h2>
          <p className="text-sm text-ink/60 mt-2">
            A free listing puts your company in front of cargo owners searching your
            lanes — from Nairobi to Rotterdam to Guangzhou.
          </p>
          <Link href="/signup" className="inline-block mt-4 bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-5 py-2.5">
            List your company free →
          </Link>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            ["01", "Post the shipment", "Lane, mode, cargo, Incoterm — a two-minute form. Free, always."],
            ["02", "Forwarders compete", "It appears on the live board and lands in matching forwarders' inboxes — Premium members quote."],
            ["03", "Compare & ship", "Quotes side by side, private messages, accept in one tap."],
          ].map(([n, h, b]) => (
            <div key={n}>
              <span className="font-display font-bold text-2xl text-tide">{n}</span>
              <h3 className="font-display font-semibold text-lg mt-1">{h}</h3>
              <p className="text-sm text-ink/60 mt-1">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Why forwarders join ---- */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-4">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-sea">Why forwarders join</p>
        <h2 className="font-display font-bold text-2xl mt-2">Your digital storefront — free, forever</h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[
            ["Be found by real shippers", "Appear in searches for your lanes and services — the moment cargo owners look for a forwarder in your corridor."],
            ["A profile you control", "Services, trade lanes, contacts, your story — updated by you in minutes, no webmaster needed."],
            ["Reviews that build trust", "Every completed shipment can earn a rating. Reputation compounds where customers can see it."],
            ["The verified badge", "Hand-checked verification that tells shippers you're the real thing. Earned, never bought."],
          ].map(([h, b]) => (
            <div key={h} className="bg-paper border border-ink/10 rounded-xl p-5">
              <h3 className="font-display font-semibold text-[15px]">{h}</h3>
              <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Claim strip ---- */}
      {unclaimed > 0 && (
        <section className="bg-parchment border-y border-ink/10">
          <div className="mx-auto max-w-6xl px-5 py-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-xl">Is your company already listed?</h2>
              <p className="text-sm text-ink/65 mt-1">
                {unclaimed} forwarders across Kenya, Tanzania, Uganda, Ethiopia, the
                U.A.E. and China are listed from public records — find yours and claim
                it free to take control of the profile.
              </p>
            </div>
            <Link href="/directory" className="bg-sea hover:brightness-110 transition text-paper font-semibold text-sm rounded-lg px-6 py-3">
              Find &amp; claim your listing
            </Link>
          </div>
        </section>
      )}

      {/* ---- Premium strip ---- */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="rounded-2xl overflow-hidden border border-ink/10 grid sm:grid-cols-[1.3fr_1fr]">
          <div className="bg-ink text-paper p-8">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-saffron">Premium membership</p>
            <h2 className="font-display font-bold text-2xl mt-2">Leads land in your inbox. You quote. You win.</h2>
            <ul className="mt-4 space-y-2 text-sm text-paper/80">
              <li>· Instant email alerts for every shipment on your lanes</li>
              <li>· The right to submit quotes on any open request</li>
              <li>· Premium placement above free listings in search</li>
            </ul>
          </div>
          <div className="bg-paper p-8 flex flex-col justify-center">
            <p className="font-display font-bold text-3xl">KES 2,500<span className="text-base font-medium text-ink/50"> / month</span></p>
            <p className="text-sm text-ink/55 mt-1">M-Pesa or card · 30 days per payment · no auto-charge</p>
            <div className="flex gap-3 mt-5">
              <Link href="/upgrade" className="bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-5 py-2.5">Go Premium</Link>
              <Link href="/pricing" className="border border-ink/20 hover:border-ink/50 transition text-ink font-medium text-sm rounded-lg px-5 py-2.5">See pricing</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
