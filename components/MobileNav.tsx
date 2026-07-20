"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Mobile navigation: hamburger toggle + dropdown panel. Rendered by the
// server Navbar below md; receives auth state as a prop so it stays a
// simple client island.
export default function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 -mr-2 text-ink"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7 H20 M4 12 H20 M4 17 H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-30 border-b border-ink/10 bg-paper shadow-lg">
          <nav className="mx-auto max-w-6xl px-5 py-3 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[15px] font-medium text-ink/80 border-b border-ink/5 last:border-0"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/rfq/new"
              onClick={() => setOpen(false)}
              className="mt-3 mb-1 text-center text-sm font-semibold text-ink bg-saffron rounded-lg py-2.5"
            >
              Post an RFQ
            </Link>
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="mb-3 mt-1 text-center text-sm font-semibold text-sea border border-sea/30 rounded-lg py-2.5"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mb-3 mt-1 text-center text-sm font-semibold text-sea border border-sea/30 rounded-lg py-2.5"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
