import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import VerifyToggle from "@/components/VerifyToggle";
import ClaimActions from "@/components/ClaimActions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Company = {
  id: string;
  company_name: string;
  slug: string;
  hq_country: string;
  hq_city: string | null;
  membership_tier: string;
  is_verified: boolean;
  is_published: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  // Silently redirecting a non-admin to the homepage is what made the emailed
  // "Open the claims queue" link look broken: you land back on the front page
  // with no idea why. Say what happened instead.
  if (me?.role !== "admin") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen px-5 py-20">
          <div className="mx-auto max-w-lg text-center">
            <h1 className="font-display font-bold text-2xl">Admin only</h1>
            <p className="text-ink/60 mt-2 text-[15px] leading-relaxed">
              This is the claims and moderation queue. You are signed in as{" "}
              <span className="font-medium text-ink">{user.email}</span>, which
              is not an admin account. Sign in with your admin account to
              approve claims.
            </p>
            <form action="/auth/signout" method="post" className="mt-6">
              <button
                type="submit"
                className="bg-sea hover:bg-ink transition text-paper font-semibold text-sm rounded-lg px-5 py-2.5"
              >
                Sign out and switch account
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  // Admin client: see every company, including unpublished drafts.
  const admin = createAdminClient();
  const { data } = await admin
    .from("forwarder_companies")
    .select(
      `id, company_name, slug, hq_country, hq_city, membership_tier,
       is_verified, is_published, rating_avg, rating_count, created_at`
    )
    .order("created_at", { ascending: false });
  const companies = (data ?? []) as Company[];

  type Claim = {
    id: string;
    role_at_company: string | null;
    business_email: string | null;
    phone: string | null;
    evidence: string | null;
    created_at: string;
    forwarder_companies: { company_name: string; slug: string } | null;
    claimant: { full_name: string | null; email: string | null } | null;
  };
  const { data: claimRows } = await admin
    .from("listing_claims")
    .select(
      `id, role_at_company, business_email, phone, evidence, created_at,
       forwarder_companies(company_name, slug),
       claimant:profiles!listing_claims_claimant_id_fkey(full_name, email)`
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const claims = (claimRows ?? []) as unknown as Claim[];

  // Decided claims used to vanish the moment you clicked, leaving no record of
  // what you approved or turned down and no way to spot a mistake. Keep the
  // last dozen visible.
  const { data: decidedRows } = await admin
    .from("listing_claims")
    .select(
      `id, status, decided_at, created_at,
       forwarder_companies(company_name, slug),
       claimant:profiles!listing_claims_claimant_id_fkey(full_name, email)`
    )
    .neq("status", "pending")
    .order("decided_at", { ascending: false })
    .limit(12);
  const decided = (decidedRows ?? []) as unknown as {
    id: string;
    status: string;
    decided_at: string | null;
    forwarder_companies: { company_name: string; slug: string } | null;
    claimant: { full_name: string | null; email: string } | null;
  }[];

  const queue = companies.filter((c) => c.is_published && !c.is_verified);
  const rest = companies.filter((c) => !(c.is_published && !c.is_verified));

  const stat = (label: string, value: number) => (
    <div className="bg-mist rounded-lg p-3">
      <p className="font-display font-bold text-xl">{value}</p>
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">{label}</p>
    </div>
  );

  const Row = ({ c }: { c: Company }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-paper rounded-lg px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/forwarders/${c.slug}`}
            className="font-display font-semibold text-sm hover:text-sea"
          >
            {c.company_name}
          </a>
          {c.membership_tier === "premium" && (
            <span className="font-mono text-[9px] uppercase text-ink bg-saffron/90 rounded px-1.5 py-0.5">
              Premium
            </span>
          )}
          {c.is_verified && (
            <span className="font-mono text-[9px] uppercase text-tide border border-tide/40 rounded px-1.5 py-0.5">
              ✓ Verified
            </span>
          )}
          {!c.is_published && (
            <span className="font-mono text-[9px] uppercase text-ink/50 border border-ink/20 rounded px-1.5 py-0.5">
              Unlisted
            </span>
          )}
        </div>
        <p className="font-mono text-[11px] text-ink/50 mt-0.5">
          {c.hq_city ? `${c.hq_city}, ` : ""}
          {c.hq_country} · ★ {Number(c.rating_avg).toFixed(1)} ({c.rating_count}) · joined{" "}
          {formatDate(c.created_at)}
        </p>
      </div>
      <VerifyToggle forwarderId={c.id} verified={c.is_verified} />
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
            Admin
          </p>
          <h1 className="font-display font-bold text-3xl mt-1">Verification queue</h1>
          <p className="text-sm text-ink/60 mt-1.5">
            The ✓ badge tells shippers a company has been checked — licence, physical
            presence, trade references. Grant it only after real diligence.
          </p>

          <div className="grid grid-cols-4 gap-3 mt-5">
            {stat("Companies", companies.length)}
            {stat("Published", companies.filter((c) => c.is_published).length)}
            {stat("Premium", companies.filter((c) => c.membership_tier === "premium").length)}
            {stat("Verified", companies.filter((c) => c.is_verified).length)}
          </div>

          <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45 mt-8 mb-2">
            Listing claims · {claims.length}
          </h2>
          <div className="space-y-2">
            {claims.length === 0 && (
              <p className="text-sm text-ink/50 border border-dashed border-ink/20 rounded-lg px-4 py-4 text-center">
                No pending claims.
              </p>
            )}
            {claims.map((cl) => (
              <div key={cl.id} className="border border-saffron/50 bg-paper rounded-lg px-3.5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm">
                      {cl.forwarder_companies?.company_name ?? "Unknown listing"}
                      <a
                        href={`/forwarders/${cl.forwarder_companies?.slug ?? ""}`}
                        className="font-sans font-normal text-xs text-sea hover:underline ml-2"
                      >
                        view listing →
                      </a>
                    </p>
                    <p className="text-sm text-ink/70 mt-1">
                      Claimed by <span className="font-medium text-ink">{cl.claimant?.full_name ?? "Unnamed"}</span>
                      {cl.role_at_company ? ` (${cl.role_at_company})` : ""} · {cl.claimant?.email}
                    </p>
                    <p className="font-mono text-[11px] text-ink/55 mt-0.5">
                      {cl.business_email && <>work: {cl.business_email} · </>}
                      {cl.phone && <>tel: {cl.phone} · </>}
                      filed {formatDate(cl.created_at)}
                    </p>
                    {cl.evidence && (
                      <p className="text-xs text-ink/60 mt-1.5 border-l-2 border-ink/15 pl-2">{cl.evidence}</p>
                    )}
                  </div>
                  <ClaimActions claimId={cl.id} />
                </div>
              </div>
            ))}
          </div>

          {decided.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45 mb-2">
                Recently decided
              </h3>
              <div className="space-y-1">
                {decided.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border border-ink/10 bg-paper/60 rounded-lg px-3.5 py-2"
                  >
                    <span className="text-sm">
                      <span className="font-medium text-ink">
                        {d.forwarder_companies?.company_name ?? "Listing removed"}
                      </span>
                      <span className="text-ink/50"> · {d.claimant?.email ?? "unknown"}</span>
                    </span>
                    <span className="font-mono text-[11px] shrink-0">
                      <span className={d.status === "approved" ? "text-tide" : "text-ink/45"}>
                        {d.status}
                      </span>
                      {d.decided_at && (
                        <span className="text-ink/40"> · {formatDate(d.decided_at)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45 mt-8 mb-2">
            Awaiting verification · {queue.length}
          </h2>
          <div className="space-y-2">
            {queue.length === 0 && (
              <p className="text-sm text-ink/50 border border-dashed border-ink/20 rounded-lg px-4 py-5 text-center">
                Queue is clear.
              </p>
            )}
            {queue.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </div>

          <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45 mt-8 mb-2">
            All companies · {rest.length}
          </h2>
          <div className="space-y-2">
            {rest.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
