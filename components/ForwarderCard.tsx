import Link from "next/link";
import type { ForwarderListing } from "@/lib/types";
import { countryCode } from "@/lib/format";

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="text-sm" aria-label={`${value} out of 5`}>
      <span className="text-saffron">{"\u2605".repeat(filled)}</span>
      <span className="text-ink/20">{"\u2605".repeat(5 - filled)}</span>
    </span>
  );
}

export default function ForwarderCard({ f }: { f: ForwarderListing }) {
  const isPremium = f.membership_tier === "premium";

  const services = (f.forwarder_services ?? [])
    .map((s) => s.services?.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 4);

  const lanes = (f.forwarder_lanes ?? [])
    .slice(0, 3)
    .map((l) => `${countryCode(l.origin_country)}\u2192${countryCode(l.destination_country)}`);

  return (
    <article
      className={`relative bg-paper rounded-xl p-5 flex flex-col border ${
        isPremium ? "border-saffron/40 ring-1 ring-saffron/20" : "border-ink/10"
      }`}
    >
      {isPremium && (
        <span className="absolute -top-2.5 left-5 font-mono text-[10px] tracking-[0.18em] uppercase text-paper bg-saffron rounded px-2 py-0.5">
          Premium
        </span>
      )}

      <div className={`flex items-start justify-between gap-3 ${isPremium ? "mt-1" : ""}`}>
        <div>
          <h3 className="font-display font-semibold text-[17px] leading-snug">{f.company_name}</h3>
          <p className="mt-1 text-sm text-ink/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron inline-block" />
            {[f.hq_city, f.hq_country].filter(Boolean).join(", ")}
          </p>
        </div>
        {f.is_verified && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="Verified">
            <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 16l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="#16B3A6" />
            <path d="M9 12l2 2 4-4" stroke="#FBFCFB" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          {services.map((name) => (
            <span key={name} className="font-mono text-[10px] tracking-wide uppercase bg-mist text-sea rounded px-1.5 py-1">
              {name}
            </span>
          ))}
        </div>
      )}

      {lanes.length > 0 && (
        <div className="mt-3.5">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/40 mb-1">Lanes</p>
          <p className="font-mono text-[13px] text-sea">{lanes.join("  \u00B7  ")}</p>
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center gap-1.5">
        <Stars value={f.rating_avg} />
        <span className="font-mono text-[12px] text-ink/60">
          {Number(f.rating_avg).toFixed(1)} ({f.rating_count})
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Link href={`/forwarders/${f.slug}`} className="flex-1 text-center bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg py-2">
          Request a quote
        </Link>
        <Link href={`/forwarders/${f.slug}`} className="text-sm font-medium text-sea border border-sea/25 hover:bg-mist transition rounded-lg px-3 py-2">
          View
        </Link>
      </div>
    </article>
  );
}
