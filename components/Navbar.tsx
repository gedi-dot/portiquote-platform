import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import AuthNavLinks from "@/components/AuthNavLinks";

const LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/board", label: "Board" },
  { href: "/countries", label: "Countries" },
  { href: "/routes", label: "Routes" },
  { href: "/guides", label: "Guides" },
  { href: "/news", label: "News" },
  { href: "/pricing", label: "Pricing" },
];

// Cookie-free on the server so pages using it can be statically cached.
// Auth-aware links load in the browser via AuthNavLinks / MobileNav.
export default function Navbar() {
  return (
    <header className="border-b border-ink/10 bg-paper/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="15" stroke="#0B4A54" strokeWidth="1.5" />
            <path d="M16 3 A13 13 0 0 1 16 29" stroke="#F2A83B" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2.5" fill="#F2A83B" />
            <path d="M16 4 L16 8 M16 24 L16 28 M4 16 L8 16 M24 16 L28 16" stroke="#0B4A54" strokeWidth="1.5" />
          </svg>
          <span className="font-display font-bold text-[15px] tracking-[0.18em] uppercase text-ink">
            N.K.&nbsp;Gedi&nbsp;&amp;&nbsp;Co.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink transition">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/rfq/new"
            className="hidden sm:inline text-sm font-semibold text-ink bg-saffron hover:brightness-95 transition rounded-md px-3.5 py-2"
          >
            Post an RFQ
          </Link>
          <AuthNavLinks />
          <MobileNav links={LINKS} />
        </div>
      </div>
    </header>
  );
}
