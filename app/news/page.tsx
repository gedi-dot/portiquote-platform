import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata = { title: "News & Insights — N.K. Gedi & Co." };

export default async function NewsPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, type, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

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
