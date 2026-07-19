import Link from "next/link";

const COLS = [
  {
    head: "Platform",
    links: [
      { href: "/directory", label: "Forwarder directory" },
      { href: "/countries", label: "Browse by country" },
      { href: "/routes", label: "Shipping routes" },
      { href: "/rfq/new", label: "Post an RFQ" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    head: "Resources",
    links: [
      { href: "/guides", label: "Freight guides" },
      { href: "/guides/incoterms", label: "Incoterms 2020" },
      { href: "/guides/container-specifications", label: "Container specs" },
      { href: "/guides/imdg-classes", label: "IMDG classes" },
      { href: "/news", label: "News" },
    ],
  },
  {
    head: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/forwarders/new", label: "List your company" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-10 grid gap-8 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="15" stroke="#486071" strokeWidth="1.5" />
              <path d="M16 3 A13 13 0 0 1 16 29" stroke="#EF7C9B" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="2.5" fill="#EF7C9B" />
            </svg>
            <span className="font-display font-bold text-[13px] tracking-[0.18em] uppercase text-ink">
              N.K. Gedi &amp; Co.
            </span>
          </div>
          <p className="text-sm text-ink/55 mt-3 max-w-[220px]">
            Rooted in Africa. Moving cargo worldwide.
          </p>
          <p className="font-mono text-[11px] text-ink/40 mt-4">Nairobi · Indian Ocean coast</p>
        </div>
        {COLS.map((c) => (
          <div key={c.head}>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">{c.head}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink/70 hover:text-ink transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink/5">
        <p className="mx-auto max-w-6xl px-5 py-4 font-mono text-[11px] text-ink/40">
          © {new Date().getFullYear()} N.K. Gedi &amp; Co. · Freight forwarder marketplace
        </p>
      </div>
    </footer>
  );
}
