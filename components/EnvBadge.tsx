"use client";

import { useEffect, useState } from "react";
import { ENV_COOKIE } from "@/lib/runtime";

// Marks non-production environments, so a staging tab left open is never mistaken
// for the live site. Production shows nothing at all.
//
// The value comes from a cookie middleware sets, not from process.env read during
// render. Most pages are statically prerendered, so a server-read value would be
// baked in at build time — and one image serves both environments, so it would be
// identical in each. Reading it on the client is what makes it follow the
// container. The cost is that it appears just after hydration, which is fine for
// a label.
export default function EnvBadge() {
  const [env, setEnv] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${ENV_COOKIE}=([^;]*)`)
    );
    const value = match ? decodeURIComponent(match[1]) : "";
    setEnv(value && value !== "production" ? value : null);
  }, []);

  if (!env) return null;

  return (
    <div
      // pointer-events-none so it can never swallow a click on whatever sits
      // underneath it. Not aria-hidden: knowing you are on staging matters to
      // someone using a screen reader too.
      className="fixed bottom-3 left-3 z-50 pointer-events-none select-none
                 rounded-full bg-coral px-3 py-1 font-mono text-[11px]
                 font-semibold uppercase tracking-[0.18em] text-paper shadow-lg"
    >
      {env}
    </div>
  );
}
