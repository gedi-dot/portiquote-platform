import Link from "next/link";
import type { ForwarderListing } from "@/lib/types";
import { flagEmoji } from "@/lib/format";

// Deterministic colour for the initials avatar (Monsoon Trade palette).
const AVATAR_COLORS = ["#0B4A54", "#16B3A6", "#F2A83B", "#EF6A45", "#062A2E"];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Normalise a website into a display host + safe href.
function webParts(url: string | null): { host: string; href: string } | null {
  if (!url) return null;
  const href = url.startsWith("http") ? url : `https://${url}`;
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return { host, href };
  } catch {
    return null;
  }
}

export default function ForwarderRow({ f }: { f: ForwarderListing }) {
  const isPremium = f.membership_tier === "premium";
  const services = (f.forwarder_services ?? [])
    .map((s) => s.services?.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 2);
  const place = [f.hq_city, f.hq_country].filter(Boolean).join(", ");
  const web = webParts(f.website ?? null);
  const phone = f.phone ?? null;

  return (
    <Link
      href={`/forwarders/${f.slug}`}
      className={`group flex items-center gap-4 px-5 py-4 border-b border-ink/8 hover:bg-mist/60 transition ${
        isPremium ? "bg-saffron/[0.06]" : ""
      }`}
    >
      {/* Logo / initials avatar */}
      {f.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={f.logo_url}
          alt=""
          className="shrink-0 w-11 h-11 rounded-lg object-cover border border-ink/10"
        />
      ) : (
        <span
          className="shrink-0 w-11 h-11 rounded-lg grid place-items-center font-display font-semibold text-[15px] text-paper"
          style={{ backgroundColor: avatarColor(f.company_name) }}
          aria-hidden="true"
        >
          {initials(f.company_name)}
        </span>
      )}

      {/* Name + location + contact (stacked) */}
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
        {/* Second line: location · phone · website (only what exists) */}
        <div className="mt-0.5 flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-[12.5px] text-ink/55">
          {place && (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">{f.hq_country ? flagEmoji(f.hq_country) : ""}</span>
              {place}
            </span>
          )}
          {phone && <span className="text-ink/60">{phone}</span>}
          {web && <span className="text-sea truncate max-w-[180px]">{web.host}</span>}
        </div>
      </div>

      {/* Services (desktop) */}
      <span className="hidden lg:block shrink-0 w-52 truncate text-[12px] text-ink/50">
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
