"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <Logo size={26} />
          <span className="font-display font-bold text-[15px] tracking-[0.18em] uppercase text-ink">
            FreightPair
          </span>
        </Link>

        <div className="bg-paper border border-ink/10 rounded-xl p-6">
          <h1 className="font-display font-semibold text-xl">Sign in</h1>
          <p className="text-sm text-ink/60 mt-1">Welcome back. Enter your details to continue.</p>

          <div className="mt-5 space-y-3">
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
              <span className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Password</span>
                <Link href="/forgot-password" className="text-xs text-sea hover:underline">Forgot password?</Link>
              </span>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                placeholder="••••••••"
              />
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="mt-5 w-full bg-sea hover:bg-ink transition text-paper font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-sm text-ink/60 text-center">
            New here?{" "}
            <Link href="/signup" className="text-sea font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
