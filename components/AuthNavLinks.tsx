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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Look up the role so admins get a permanent way into the queue, rather
    // than having to dig out a notification email to find the link.
    // One indexed row, only for signed-in users; signed-out visitors pay
    // nothing and the navbar stays cookie-free on the server.
    async function load(session: unknown) {
      setSignedIn(Boolean(session));
      if (!session) {
        setIsAdmin(false);
        return;
      }
      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", me.user.id)
        .maybeSingle();
      setIsAdmin(profile?.role === "admin");
    }

    supabase.auth.getSession().then(({ data }) => void load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      void load(session)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (signedIn) {
    return (
      <>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden sm:inline text-sm font-semibold text-saffron hover:brightness-90 transition"
          >
            Admin
          </Link>
        )}
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
