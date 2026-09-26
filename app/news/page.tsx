import Link from "next/link";
import { unstable_cache } from "next/cache";
import Navbar from "@/components/Navbar";
import { createPublicClient } from "@/lib/supabase/public";
import { formatDate } from "@/lib/format";

// Cached for a day at runtime rather than prerendered at build time — the CI
// build has no database. See app/page.tsx for the full reasoning.
export const dynamic = "force-dynamic";

export const metadata = { title: "News & Insights" };

const getPublishedPosts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, type, published_at, created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    return data;
  },
  ["news-published-posts"],
  { revalidate: 86400 }
);

export default async function NewsPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide">News</p>
          <h1 className="font-display font-bold text-3xl mt-1">News &amp; insights</h1>
          <p className="text-ink/60 mt-2">
            Market notes, port updates, and platform announcements from the East African freight desk.
          </p>

          {(posts ?? []).length === 0 ? (
            <div className="mt-8 bg-paper border border-ink/10 rounded-xl p-6">
              <p className="text-sm text-ink/70">
                No published posts yet. Meanwhile, the{" "}
                <Link href="/guides" className="text-sea font-semibold underline decoration-saffron/60">
                  freight guides
                </Link>{" "}
                cover Incoterms, container specs, and IMDG classes.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {(posts ?? []).map((p) => (
                <Link
                  key={p.id}
                  href={`/news/${p.slug}`}
                  className="block bg-paper border border-ink/10 rounded-xl p-5 hover:border-tide/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-tide">
                      {p.type === "press_release" ? "Press release" : p.type === "guide" ? "Guide" : "News"}
                    </span>
                    <span className="font-mono text-[10px] text-ink/40">
                      {formatDate(p.published_at ?? p.created_at)}
                    </span>
                  </div>
                  <h2 className="font-display font-semibold text-lg mt-1.5">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-ink/60 mt-1.5">{p.excerpt}</p>}
                  <span className="font-mono text-[11px] text-saffron mt-3 inline-block">Read →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
