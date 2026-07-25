import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReviewForm from "@/components/ReviewForm";
import ForwarderMessage from "@/components/ForwarderMessage";
import { createClient } from "@/lib/supabase/server";
import JsonLd from "@/components/JsonLd";
import { countryCode, modeLabel, formatDate, flagEmoji } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

type Profile = {
  id: string;
  owner_id: string | null;
  company_name: string;
  tagline: string | null;
  description: string | null;
  hq_country: string;
  hq_city: string | null;
  year_established: number | null;
  employee_count: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  membership_tier: "free" | "premium";
  is_verified: boolean;
  is_claimed: boolean;
  rating_avg: number;
  rating_count: number;
  forwarder_services: { services: { name: string } | null }[];
  forwarder_lanes: {
    origin_country: string;
    destination_country: string;
    modes: string[] | null;
  }[];
};

type Review = {
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
};

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-label={`${value} out of 5`}>
      <span className="text-saffron">{"\u2605".repeat(filled)}</span>
      <span className="text-paper/25">{"\u2605".repeat(5 - filled)}</span>
    </span>
  );
}


export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: f } = await supabase
    .from("forwarder_companies")
    .select("company_name, tagline, description, hq_country, hq_city")
    .eq("slug", slug)
    .maybeSingle();
  if (!f) return {};
  const where = f.hq_city ? `${f.hq_city}, ${f.hq_country}` : f.hq_country;
  const desc =
    f.tagline ??
    (f.description ? String(f.description).slice(0, 155) : null) ??
    `Vetted freight forwarder in ${where}. Request quotes for ocean, air, road and RoRo shipments.`;
  return {
    title: `${f.company_name} — Freight Forwarder in ${where}`,
    description: desc,
    alternates: { canonical: `/forwarders/${slug}` },
    openGraph: { title: `${f.company_name} — Freight Forwarder in ${where}`, description: desc },
  };
}

export default async function ForwarderProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("forwarder_companies")
    .select(
      `id, owner_id, company_name, tagline, description, hq_country, hq_city,
       year_established, employee_count, website, email, phone, whatsapp,
       membership_tier, is_verified, is_claimed, rating_avg, rating_count,
       forwarder_services ( services ( name ) ),
       forwarder_lanes ( origin_country, destination_country, modes )`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const f = data as unknown as Profile;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("rating, comment, reviewer_name, created_at")
    .eq("forwarder_id", f.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const reviews = (reviewRows ?? []) as Review[];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === f.owner_id;
  const canReview = Boolean(user) && !isOwner;

  // Forwarder-to-forwarder messaging: show a DM button only when the viewer
  // runs their OWN (different) forwarder and this listing is claimed (has an
  // owner to receive the message). Keeps messaging professional and spam-free.
  // Messaging is a Premium-forwarder feature. Only a Premium member can start
  // (or reply to) a conversation, in both directions.
  let viewerCanMessage = false;
  if (user && !isOwner && f.owner_id) {
    const { data: myFwd } = await supabase
      .from("forwarder_companies")
      .select("membership_tier")
      .eq("owner_id", user.id)
      .maybeSingle();
    viewerCanMessage = myFwd?.membership_tier === "premium";
  }

  const services = f.forwarder_services
    .map((s) => s.services?.name)
    .filter((n): n is string => Boolean(n));

  // Does the viewer run a Premium forwarder? Full contact details are a
  // Premium benefit — the people who pay get to reach other companies directly.
  let viewerIsPremium = false;
  if (user) {
    const { data: myCompany } = await supabase
      .from("forwarder_companies")
      .select("membership_tier")
      .eq("owner_id", user.id)
      .maybeSingle();
    viewerIsPremium = myCompany?.membership_tier === "premium";
  }

  // Website is always public (it came from public directories and helps
  // shippers find the company). Phone/email/WhatsApp are shown to the owner
  // and to Premium members — a paid benefit and the payoff for claiming.
  const publicContact = [
    f.website ? { label: "Website", value: f.website } : null,
  ].filter((c): c is { label: string; value: string } => c !== null);

  const maySeeContact = f.is_claimed && (isOwner || viewerIsPremium);
  const privateContact = maySeeContact
    ? [
        f.email ? { label: "Email", value: f.email } : null,
        f.phone ? { label: "Phone", value: f.phone } : null,
        f.whatsapp ? { label: "WhatsApp", value: f.whatsapp } : null,
      ].filter((c): c is { label: string; value: string } => c !== null)
    : [];

  const contact = [...publicContact, ...privateContact];

  return (
    <>
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: f.company_name,
          url: `${SITE_URL}/forwarders/${slug}`,
          ...(f.tagline ? { description: f.tagline } : {}),
          address: {
            "@type": "PostalAddress",
            ...(f.hq_city ? { addressLocality: f.hq_city } : {}),
            addressCountry: f.hq_country,
          },
          ...(f.phone ? { telephone: f.phone } : {}),
          ...(f.email ? { email: f.email } : {}),
          ...(f.website ? { sameAs: [f.website] } : {}),
          ...(f.rating_count > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: Number(f.rating_avg).toFixed(1),
                  reviewCount: f.rating_count,
                },
              }
            : {}),
        }}
      />

      {!f.is_claimed && (
        <div className="bg-parchment border-b border-ink/10">
          <div className="mx-auto max-w-5xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/70">
              <span className="font-semibold text-ink">Unclaimed listing</span> — created from
              public business information. Is this your company?
            </p>
            <Link
              href={`/forwarders/${slug}/claim`}
              className="bg-sea hover:brightness-110 transition text-paper text-sm font-semibold rounded-lg px-4 py-2"
            >
              Claim this listing — free
            </Link>
          </div>
        </div>
      )}
      {/* ---- Header ---- */}
      <section className="relative overflow-hidden bg-sea text-paper">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 120% at 12% 0%, #0B4A54 0%, #062A2E 100%)" }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-bold text-2xl sm:text-3xl">{f.company_name}</h1>
                {f.membership_tier === "premium" && (
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink bg-saffron rounded px-2 py-0.5">
                    Premium
                  </span>
                )}
                {!f.is_claimed && (
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-paper/80 border border-paper/40 rounded px-2 py-0.5">
                    Unclaimed
                  </span>
                )}
                {f.is_verified && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Verified">
                    <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 16l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="#16B3A6" />
                    <path d="M9 12l2 2 4-4" stroke="#FBFCFB" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p className="text-paper/70 text-sm mt-1.5 flex flex-wrap items-center gap-x-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-saffron inline-block" />
                  {flagEmoji(f.hq_country)} {[f.hq_city, f.hq_country].filter(Boolean).join(", ")}
                </span>
                {f.year_established && <span>· since {f.year_established}</span>}
                {f.employee_count && <span>· {f.employee_count} staff</span>}
              </p>
              {f.tagline && <p className="text-paper/80 text-sm mt-2 max-w-xl">{f.tagline}</p>}
              <p className="mt-2 text-sm">
                <Stars value={f.rating_avg} />{" "}
                <span className="font-mono text-[12px] text-paper/70">
                  {Number(f.rating_avg).toFixed(1)} · {f.rating_count} review{f.rating_count === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <Link
              href="/rfq/new"
              className="bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg px-5 py-2.5"
            >
              Request a quote
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Owner banner ---- */}
      {isOwner && (
        <div className="bg-parchment border-b border-ink/10">
          <div className="mx-auto max-w-5xl px-5 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink/70">
              This is your listing.
              {f.membership_tier === "free" && " Upgrade to receive and quote RFQ leads on your lanes."}
            </p>
            {f.membership_tier === "free" ? (
              <div className="flex items-center gap-2">
                <Link href={`/forwarders/${slug}/edit`} className="text-sm font-semibold text-sea hover:underline">
                  Edit profile
                </Link>
                <Link href="/upgrade" className="text-sm font-semibold text-paper bg-sea hover:bg-ink transition rounded-md px-3.5 py-1.5">
                  Go Premium
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={`/forwarders/${slug}/edit`} className="text-sm font-semibold text-sea hover:underline">
                  Edit profile
                </Link>
                <Link href="/dashboard" className="text-sm font-semibold text-sea hover:underline">
                  Open dashboard →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Body ---- */}
      <main className="mx-auto max-w-5xl px-5 py-8 grid md:grid-cols-[1fr_290px] gap-8">
        <div>
          {f.description && (
            <p className="text-[15px] text-ink/75 leading-relaxed">{f.description}</p>
          )}

          {services.length > 0 && (
            <>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mt-7 mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((name) => (
                  <span key={name} className="font-mono text-[10px] tracking-wide uppercase bg-mist text-sea rounded px-1.5 py-1">
                    {name}
                  </span>
                ))}
              </div>
            </>
          )}

          {f.forwarder_lanes.length > 0 && (
            <>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mt-7 mb-2">Trade lanes</p>
              <div className="space-y-1.5 font-mono text-[13px] text-sea">
                {f.forwarder_lanes.map((l, i) => (
                  <div key={i} className="flex justify-between border-b border-ink/5 pb-1.5 last:border-0">
                    <span>
                      {countryCode(l.origin_country)} → {countryCode(l.destination_country)}
                    </span>
                    <span className="text-ink/40">
                      {(l.modes ?? []).map(modeLabel).join(", ") || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mt-7 mb-2">
            Reviews {reviews.length > 0 && `(${f.rating_count})`}
          </p>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="bg-mist rounded-lg p-3">
                  <p className="text-saffron text-sm">
                    {"\u2605".repeat(r.rating)}
                    <span className="text-ink/20">{"\u2605".repeat(5 - r.rating)}</span>
                  </p>
                  {r.comment && <p className="text-sm text-ink/70 mt-1">{r.comment}</p>}
                  <p className="font-mono text-[10px] text-ink/40 mt-1">
                    {r.reviewer_name ?? "Shipper"} · {formatDate(r.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/50">No reviews yet.</p>
          )}

          {canReview && (
            <div className="mt-4">
              <ReviewForm forwarderId={f.id} />
            </div>
          )}
        </div>

        {/* ---- Side panel ---- */}
        <aside>
          <div className="bg-parchment rounded-xl border border-ink/10 p-4">
            <p className="font-display font-semibold text-base">Get a quote from {f.company_name.split(" ")[0]}</p>
            <p className="text-sm text-ink/60 mt-1.5">
              Post your shipment and forwarders on your lane — including this one, if Premium — will compete for it.
            </p>
            <Link
              href="/rfq/new"
              className="block text-center mt-3 bg-sea hover:bg-ink transition text-paper text-sm font-semibold rounded-lg py-2.5"
            >
              Post a shipment
            </Link>
          </div>

          {contact.length > 0 && (
            <div className="mt-4 bg-paper rounded-xl border border-ink/10 p-4">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45 mb-2">Contact</p>
              <div className="space-y-1.5 text-sm">
                {contact.map((c) => (
                  <div key={c.label} className="flex justify-between gap-3">
                    <span className="text-ink/50">{c.label}</span>
                    <span className="text-ink font-medium break-all text-right">{c.value}</span>
                  </div>
                ))}
              </div>
              {f.is_claimed && !maySeeContact && (f.email || f.phone || f.whatsapp) && (
                <p className="mt-3 pt-3 border-t border-ink/8 text-xs text-ink/50">
                  Full contact details are visible to Premium members.{" "}
                  <Link href="/upgrade" className="text-sea hover:underline">
                    Go Premium
                  </Link>{" "}
                  to reach {f.company_name.split(" ")[0]} directly.
                </p>
              )}
              {!f.is_claimed && (f.email || f.phone || f.whatsapp) && (
                <p className="mt-3 pt-3 border-t border-ink/8 text-xs text-ink/50">
                  Phone and email appear once this company claims its listing.
                </p>
              )}
              {viewerCanMessage && user && f.owner_id && (
                <ForwarderMessage
                  meId={user.id}
                  otherUserId={f.owner_id}
                  otherName={f.company_name}
                />
              )}
            </div>
          )}
        </aside>
      </main>
    </>
  );
}
