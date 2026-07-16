import Link from "next/link";
import type { ForwarderListing } from "@/lib/types";

// One dense, scannable line per forwarder — built for browsing hundreds.
export default function ForwarderRow({ f }: { f: ForwarderListing }) {
  const isPremium = f.membership_tier === "premium";
  const services = (f.forwarder_services ?? [])
    .map((s) => s.services?.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 3);
  const place = [f.hq_city, f.hq_country].filter(Boolean).join(", ");

  return (
    <Link
      href={`/forwarders/${f.slug}`}
      className={`group flex items-center gap-3 px-4 py-3 border-b border-ink/8 hover:bg-mist/60 transition ${
        isPremium ? "bg-saffron/[0.06]" : ""
      }`}
    >
      {/* Name + premium/verified marks */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-[15px] text-ink truncate group-hover:text-sea transition">
            {f.company_name}
          </span>
          {isPremium && (
            <span className="shrink-0 font-mono text-[8px] tracking-[0.15em] uppercase text-paper bg-saffron rounded px-1.5 py-0.5">
              Premium
            </span>
          )}
          {f.is_verified && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Verified" className="shrink-0">
              <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 16l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="#16B3A6" />
              <path d="M9 12l2 2 4-4" stroke="#FBFCFB" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Location */}
      <span className="hidden sm:block shrink-0 w-40 truncate text-[13px] text-ink/60">
        {place || "—"}
      </span>

      {/* Services */}
      <span className="hidden md:block shrink-0 w-56 truncate text-[12px] text-ink/50">
        {services.join(" · ") || "—"}
      </span>

      {/* Rating / claim state */}
      <span className="shrink-0 w-20 text-right text-[12px]">
        {f.rating_count > 0 ? (
          <span className="text-ink/70">
            <span className="text-saffron">★</span> {f.rating_avg.toFixed(1)}
          </span>
        ) : !f.is_claimed ? (
          <span className="font-mono text-[9px] uppercase tracking-wide text-ink/45 border border-ink/20 rounded px-1.5 py-0.5">
            Unclaimed
          </span>
        ) : (
          <span className="text-ink/30">—</span>
        )}
      </span>
    </Link>
  );
}
