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
    // Not sticky — the header scrolls away with the page. It stays `relative`
    // so it remains the positioned ancestor that MobileNav's dropdown anchors
    // to; without that the menu would position against the document and end up
    // off-screen once the page had been scrolled.
    <header className="border-b border-ink/10 bg-paper relative z-20">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Logo size={26} />
          <span className="font-display font-bold text-[19px] tracking-[-0.01em] text-ink">
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
