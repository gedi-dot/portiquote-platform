"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    // Always show the same message — never reveal whether an account exists.
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm bg-paper border border-ink/10 rounded-2xl p-7">
        {sent ? (
          <div className="text-center">
            <h1 className="font-display font-semibold text-xl">Check your email</h1>
            <p className="text-sm text-ink/60 mt-2">
              If an account exists for <span className="font-medium text-ink">{email}</span>,
              a password reset link is on its way. The link works once and expires
              after a short while.
            </p>
            <Link
              href="/login"
              className="inline-block mt-5 text-sm text-sea font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display font-semibold text-xl">Reset your password</h1>
            <p className="text-sm text-ink/60 mt-1.5">
              Enter the email you signed up with and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                  placeholder="you@company.com"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="text-sm text-ink/55 mt-4 text-center">
              Remembered it?{" "}
              <Link href="/login" className="text-sea font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
