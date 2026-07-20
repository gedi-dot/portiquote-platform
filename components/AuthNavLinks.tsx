"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Client island for the navbar's auth cluster. The server Navbar stays
// cookie-free (so content pages can be statically cached); the browser
// checks the session after load and swaps the links. Signed-out UI is the
// default while loading — correct for the vast majority of visitors.
export default function AuthNavLinks() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (signedIn) {
    return (
      <>
        <Link
          href="/dashboard"
          className="hidden sm:inline text-sm font-medium text-ink/70 hover:text-ink transition"
        >
          Dashboard
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm font-semibold text-paper bg-sea hover:bg-ink transition rounded-md px-3.5 py-2"
          >
            Sign out
          </button>
        </form>
      </>
    );
  }
  return (
    <>
      <Link
        href="/login"
        className="hidden sm:inline text-sm font-medium text-ink/70 hover:text-ink transition"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="text-sm font-semibold text-paper bg-sea hover:bg-ink transition rounded-md px-3.5 py-2"
      >
        List your company
      </Link>
    </>
  );
}
