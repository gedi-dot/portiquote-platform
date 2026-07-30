import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import AuthNavLinks from "@/components/AuthNavLinks";
import Logo from "@/components/Logo";

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
    <header className="border-b border-ink/10 bg-paper sticky top-0 z-20 shadow-[0_1px_3px_rgba(6,42,46,0.06)]">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Logo size={26} />
          <span className="font-display font-bold text-[15px] tracking-[0.18em] uppercase text-ink">
            FreightPair
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
