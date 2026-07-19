"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="15" stroke="#486071" strokeWidth="1.5" />
            <path d="M16 3 A13 13 0 0 1 16 29" stroke="#EF7C9B" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2.5" fill="#EF7C9B" />
          </svg>
          <span className="font-display font-bold text-[15px] tracking-[0.18em] uppercase text-ink">
            N.K.&nbsp;Gedi&nbsp;&amp;&nbsp;Co.
          </span>
        </Link>

        <div className="bg-paper border border-ink/10 rounded-xl p-6">
          {done ? (
            <div className="text-center py-4">
              <h1 className="font-display font-semibold text-xl">Check your email</h1>
              <p className="text-sm text-ink/60 mt-2">
                We sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
                Open it to finish creating your account.
              </p>
              <Link href="/login" className="inline-block mt-5 text-sea font-medium text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-semibold text-xl">Create your account</h1>
              <p className="text-sm text-ink/60 mt-1">List your company or post a shipment in minutes.</p>

              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Full name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                    placeholder="Nasin Gedi"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                    placeholder="you@company.com"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Password</span>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                    placeholder="At least 6 characters"
                  />
                </label>
              </div>

              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

              <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#486071]"
                />
                <span className="text-xs text-ink/60 leading-relaxed">
                  I have read and accept the{" "}
                  <Link href="/terms" className="text-sea hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-sea hover:underline">Privacy Policy</Link>.
                </span>
              </label>

              <button
                onClick={handleSignUp}
                disabled={loading || !agreed}
                className="mt-5 w-full bg-sea hover:bg-ink transition text-paper font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>

              <p className="mt-4 text-sm text-ink/60 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-sea font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
