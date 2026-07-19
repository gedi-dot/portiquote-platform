"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Forwarder = { id: string; company_name: string; membership_tier: string };
type Phase = "loading" | "no_forwarder" | "already" | "idle" | "prompted" | "confirming" | "success" | "failed";

const PRICE = "2,500";

export default function UpgradePage() {
  const [approx, setApprox] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/rates?amount=2500")
      .then((r) => r.json())
      .then((d) => setApprox(d.approx ?? null))
      .catch(() => {});
  }, []);
  const [phase, setPhase] = useState<Phase>("loading");
  const [forwarder, setForwarder] = useState<Forwarder | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  // Find the signed-in user's forwarder listing.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase
        .from("forwarder_companies")
        .select("id, company_name, membership_tier")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      const card = new URLSearchParams(window.location.search).get("card");
      if (!data) setPhase("no_forwarder");
      else if (data.membership_tier === "premium") {
        setForwarder(data);
        setPhase(card === "success" ? "success" : "already");
      } else {
        setForwarder(data);
        if (card === "success") {
          // Back from Stripe — the webhook flips the tier within seconds.
          setPhase("confirming");
          pollTier(data.id);
        } else {
          if (card === "cancelled") setError("Card payment was cancelled.");
          setPhase("idle");
        }
      }
    })();
  }, []);

  async function pay() {
    if (!forwarder) return;
    setError(null);
    setPhase("prompted");
    const res = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, forwarderId: forwarder.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not start payment");
      setPhase("failed");
      return;
    }
    poll(data.paymentId);
  }

  // Poll the status endpoint until the callback resolves the payment.
  function poll(paymentId: string, attempt = 0) {
    if (attempt > 20) {
      setError("Timed out waiting for confirmation. If you paid, it will reflect shortly.");
      setPhase("failed");
      return;
    }
    setTimeout(async () => {
      const res = await fetch(`/api/mpesa/status?paymentId=${paymentId}`);
      const data = await res.json();
      if (data.status === "success") {
        setReceipt(data.receipt);
        setPhase("success");
      } else if (data.status === "failed") {
        setError("Payment was cancelled or failed. Please try again.");
        setPhase("failed");
      } else {
        poll(paymentId, attempt + 1);
      }
    }, 3000);
  }

  // ---- Card fallback (Stripe Checkout) ----
  async function payCard() {
    if (!forwarder) return;
    setError(null);
    const res = await fetch("/api/paystack/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forwarderId: forwarder.id }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setError(data.error ?? "Could not start card payment");
      return;
    }
    window.location.href = data.url as string;
  }

  // After returning from Stripe, wait for the webhook to activate Premium.
  function pollTier(forwarderId: string, attempt = 0) {
    if (attempt > 8) {
      setError(
        "Payment received — Premium activates as soon as Stripe confirms. Refresh in a moment."
      );
      setPhase("failed");
      return;
    }
    setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("forwarder_companies")
        .select("membership_tier")
        .eq("id", forwarderId)
        .single();
      if (data?.membership_tier === "premium") setPhase("success");
      else pollTier(forwarderId, attempt + 1);
    }, 2500);
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="15" stroke="#0B4A54" strokeWidth="1.5" />
            <path d="M16 3 A13 13 0 0 1 16 29" stroke="#F2A83B" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2.5" fill="#F2A83B" />
          </svg>
          <span className="font-display font-bold text-[15px] tracking-[0.18em] uppercase text-ink">
            N.K.&nbsp;Gedi&nbsp;&amp;&nbsp;Co.
          </span>
        </Link>

        <div className="bg-paper border border-ink/10 rounded-2xl overflow-hidden">
          {/* header band */}
          <div className="bg-sea text-paper px-6 py-5 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-90"
              style={{ background: "radial-gradient(120% 120% at 10% 0%, #0B4A54 0%, #062A2E 100%)" }}
            />
            <div className="relative">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">Membership</span>
              <h1 className="font-display font-bold text-2xl mt-1">Go Premium</h1>
              <p className="text-paper/75 text-sm mt-1.5">
                Receive and quote RFQs on your lanes, surface above free listings, and earn a
                verified badge.
              </p>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="flex items-baseline gap-1.5 mb-5">
              <span className="font-mono text-[11px] tracking-widest uppercase text-ink/45">KES</span>
              <span className="font-display font-bold text-3xl text-ink">{PRICE}</span>
              <span className="text-ink/50 text-sm">/ month</span>
            </div>
            {approx && (
              <p className="mt-1 font-mono text-[11px] text-ink/45">{approx} / month · charged in KES</p>
            )}

            {phase === "loading" && <p className="text-sm text-ink/50">Loading your listing…</p>}

            {phase === "no_forwarder" && (
              <div className="text-sm text-ink/70">
                <p>You&apos;ll need a company listing before upgrading.</p>
                <Link href="/forwarders/new" className="inline-block mt-3 bg-sea text-paper font-semibold rounded-lg px-4 py-2">
                  Create your listing
                </Link>
              </div>
            )}

            {phase === "already" && (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-tide inline-block" />
                <span className="text-ink/70">
                  <span className="font-semibold text-ink">{forwarder?.company_name}</span> is already Premium.
                </span>
              </div>
            )}

            {(phase === "idle" || phase === "failed") && (
              <>
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">
                    M-Pesa phone number
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide"
                  />
                </label>
                {error && <p className="mt-3 text-sm text-coral">{error}</p>}
                <button
                  onClick={pay}
                  disabled={phone.replace(/\D/g, "").length < 9}
                  className="mt-4 w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
                >
                  Pay with M-Pesa
                </button>
                <p className="mt-3 text-xs text-ink/45 text-center">
                  You&apos;ll get a prompt on your phone. Enter your M-Pesa PIN to confirm.
                </p>
                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-ink/10" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">or</span>
                  <span className="h-px flex-1 bg-ink/10" />
                </div>
                <button
                  onClick={payCard}
                  className="w-full border border-sea/30 text-sea hover:bg-mist transition font-semibold text-sm rounded-lg py-3"
                >
                  Pay with card (USD)
                </button>
                <p className="mt-2 text-xs text-ink/45 text-center">
                  For members outside Kenya · Visa &amp; Mastercard worldwide, plus mobile money across Africa, via Paystack.
                </p>
              </>
            )}

            {phase === "prompted" && (
              <div className="text-center py-4">
                <div className="mx-auto w-10 h-10 rounded-full border-2 border-tide border-t-transparent animate-spin" />
                <p className="mt-4 font-display font-semibold text-lg">Check your phone</p>
                <p className="text-sm text-ink/60 mt-1">
                  We sent an M-Pesa request to <span className="font-medium text-ink">{phone}</span>.
                  Enter your PIN to complete the payment.
                </p>
              </div>
            )}

            {phase === "confirming" && (
              <div className="text-center py-4">
                <div className="mx-auto w-10 h-10 rounded-full border-2 border-tide border-t-transparent animate-spin" />
                <p className="mt-4 font-display font-semibold text-lg">Confirming your payment</p>
                <p className="text-sm text-ink/60 mt-1">This usually takes a few seconds…</p>
              </div>
            )}

            {phase === "success" && (
              <div className="text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-tide/15 grid place-items-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l4 4 10-10" stroke="#16B3A6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-4 font-display font-semibold text-lg">You&apos;re Premium</p>
                <p className="text-sm text-ink/60 mt-1">
                  {forwarder?.company_name} now receives RFQ leads.
                  {receipt && <> Receipt <span className="font-mono text-ink">{receipt}</span>.</>}
                </p>
                <Link href="/dashboard" className="inline-block mt-5 bg-sea text-paper font-semibold text-sm rounded-lg px-5 py-2.5">
                  Go to dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
