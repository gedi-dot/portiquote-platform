"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Phase = "checking" | "form" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setPhase(user ? "form" : "invalid");
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw1.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw1 });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPhase("done");
    setTimeout(() => router.replace("/dashboard"), 1800);
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm bg-paper border border-ink/10 rounded-2xl p-7">
        {phase === "checking" && <p className="text-sm text-ink/50">One moment…</p>}

        {phase === "invalid" && (
          <div className="text-center">
            <h1 className="font-display font-semibold text-xl">Link expired</h1>
            <p className="text-sm text-ink/60 mt-2">
              This reset link is invalid or has expired — they only work once.
              Request a fresh one and try again.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block mt-5 bg-saffron text-ink font-semibold text-sm rounded-lg px-5 py-2.5 hover:brightness-95"
            >
              Request a new link
            </Link>
          </div>
        )}

        {phase === "form" && (
          <>
            <h1 className="font-display font-semibold text-xl">Choose a new password</h1>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">
                  New password
                </span>
                <input
                  type="password"
                  required
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                  placeholder="At least 8 characters"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">
                  Repeat new password
                </span>
                <input
                  type="password"
                  required
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                />
              </label>
              {error && <p className="text-sm text-coral">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Set new password"}
              </button>
            </form>
          </>
        )}

        {phase === "done" && (
          <div className="text-center">
            <h1 className="font-display font-semibold text-xl">Password updated ✓</h1>
            <p className="text-sm text-ink/60 mt-2">
              You&apos;re signed in — taking you to your dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
