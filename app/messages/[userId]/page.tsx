import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import DirectThread from "@/components/DirectThread";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// A direct (RFQ-less) conversation with one other member. This page is what
// makes replying to a direct message possible — the inbox links here.
export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${userId}`);
  if (userId === user.id) notFound();

  // Messaging is a Premium-forwarder feature in both directions: only a Premium
  // member can start or reply. Free members see the thread read-only with an
  // upgrade prompt — a received message becomes a reason to go Premium.
  const { data: myCompany } = await supabase
    .from("forwarder_companies")
    .select("membership_tier")
    .eq("owner_id", user.id)
    .maybeSingle();
  const canMessage = myCompany?.membership_tier === "premium";

  // Resolve the other person's display name: their company, else profile name.
  const [{ data: company }, { data: person }] = await Promise.all([
    supabase
      .from("forwarder_companies")
      .select("company_name, slug")
      .eq("owner_id", userId)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("public_profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  const otherName =
    company?.company_name || person?.full_name || "Marketplace member";

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-2xl">
          <Link href="/messages" className="font-mono text-[11px] text-ink/50 hover:text-ink">
            ← All messages
          </Link>
          <div className="mt-3 mb-4 flex items-baseline justify-between">
            <h1 className="font-display font-bold text-2xl">{otherName}</h1>
            {company?.slug && (
              <Link
                href={`/forwarders/${company.slug}`}
                className="font-mono text-[11px] text-sea hover:text-ink"
              >
                View profile →
              </Link>
            )}
          </div>
          <DirectThread
            meId={user.id}
            otherUserId={userId}
            otherName={otherName}
            canMessage={canMessage}
          />
        </div>
      </main>
    </>
  );
}
