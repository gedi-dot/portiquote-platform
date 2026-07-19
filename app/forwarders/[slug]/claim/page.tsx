"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Fwd = { id: string; company_name: string; is_claimed: boolean };
type Phase = "loading" | "form" | "pending" | "done";

const inputCls =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide";
const labelCls = "font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45";

export default function ClaimListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [fwd, setFwd] = useState<Fwd | null>(null);
  const [role, setRole] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?next=/forwarders/${slug}/claim`);
        return;
      }
      const { data } = await supabase
        .from("forwarder_companies")
        .select("id, company_name, is_claimed")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) {
        router.replace("/");
        return;
      }
      if (data.is_claimed) {
        router.replace(`/forwarders/${slug}`);
        return;
      }
      setFwd(data);
      const { data: mine } = await supabase
        .from("listing_claims")
        .select("id, status")
        .eq("forwarder_id", data.id)
        .eq("claimant_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      setPhase(mine ? "pending" : "form");
    })();
  }, [router, slug]);

  async function submit() {
    if (!fwd) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: claim, error: err } = await supabase
      .from("listing_claims")
      .insert({
        forwarder_id: fwd.id,
        claimant_id: user.id,
        role_at_company: role.trim() || null,
        business_email: bizEmail.trim() || null,
        phone: phone.trim() || null,
        evidence: evidence.trim() || null,
      })
      .select("id")
      .single();

    setSaving(false);
    if (err || !claim) {
      setError(
        err?.code === "23505"
          ? "You already have a claim pending for this listing."
          : "Could not submit the claim — please try again."
      );
      return;
    }
    // fire-and-forget: tell the platform team
    void fetch("/api/notify/claim-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId: claim.id }),
      keepalive: true,
    }).catch(() => {});
    setPhase("done");
  }

  return (
    <main className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link
          href={`/forwarders/${slug}`}
          className="font-mono text-[11px] text-ink/50 hover:text-ink"
        >
          ← Back to the listing
        </Link>
        <div className="mt-4 bg-paper border border-ink/10 rounded-2xl overflow-hidden">
          <div className="bg-sea text-paper px-6 py-5 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 120% at 10% 0%, #486071 0%, #22303C 100%)",
              }}
            />
            <div className="relative">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
                Claim your listing
              </span>
              <h1 className="font-display font-bold text-2xl mt-1">
                {fwd?.company_name ?? "…"}
              </h1>
              <p className="text-paper/75 text-sm mt-1.5">
                Free. Once verified, you control the profile — services, lanes,
                contact details — and can go Premium for leads.
              </p>
            </div>
          </div>

          <div className="p-6">
            {phase === "loading" && (
              <p className="text-sm text-ink/50">Loading…</p>
            )}

            {phase === "pending" && (
              <div className="text-center py-4">
                <p className="font-display font-semibold text-lg">
                  Your claim is being reviewed
                </p>
                <p className="text-sm text-ink/60 mt-1.5">
                  We verify every claim by hand — usually within 1–2 business
                  days. You&apos;ll get an email the moment it&apos;s approved.
                </p>
              </div>
            )}

            {phase === "done" && (
              <div className="text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-tide/15 grid place-items-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l4 4 10-10"
                      stroke="#7FB8A4"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-4 font-display font-semibold text-lg">
                  Claim received
                </p>
                <p className="text-sm text-ink/60 mt-1.5">
                  We verify every claim by hand — usually within 1–2 business
                  days. You&apos;ll get an email when it&apos;s approved.
                </p>
              </div>
            )}

            {phase === "form" && (
              <div className="space-y-4">
                <label className="block">
                  <span className={labelCls}>Your role at the company *</span>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Director, Operations Manager"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Business email</span>
                  <input
                    type="email"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    placeholder="you@yourcompany.co.ke"
                    className={inputCls}
                  />
                  <span className="text-xs text-ink/45">
                    An email on your company&apos;s own domain is the fastest
                    way to verify.
                  </span>
                </label>
                <label className="block">
                  <span className={labelCls}>Phone / WhatsApp</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>
                    Anything that helps us verify (optional)
                  </span>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    rows={2}
                    placeholder="Company website, registration number, KIFWA membership…"
                    className={inputCls}
                  />
                </label>
                {error && <p className="text-sm text-coral">{error}</p>}
                <button
                  onClick={submit}
                  disabled={saving || !role.trim()}
                  className="w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
                >
                  {saving ? "Submitting…" : "Submit claim"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
