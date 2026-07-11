import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import JsonLd from "@/components/JsonLd";
import { formatDate } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, body, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!post) return {};
  const desc = post.excerpt ?? String(post.body ?? "").slice(0, 155);
  return {
    title: post.title,
    description: desc,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: desc,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
    },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, body, type, published_at, created_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (!post) notFound();

  const paragraphs: string[] = String(post.body ?? "")
    .split(/\n\s*\n/)
    .filter(Boolean);

  return (
    <>
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          ...(post.excerpt ? { description: post.excerpt } : {}),
          ...(post.published_at ? { datePublished: post.published_at } : {}),
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME },
          mainEntityOfPage: `${SITE_URL}/news/${slug}`,
        }}
      />
      <main className="min-h-screen px-5 py-12">
        <article className="mx-auto max-w-2xl">
          <Link href="/news" className="font-mono text-[11px] text-ink/50 hover:text-ink">← All news</Link>
          <div className="mt-4 flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-tide">
              {post.type === "press_release" ? "Press release" : post.type === "guide" ? "Guide" : "News"}
            </span>
            <span className="font-mono text-[10px] text-ink/40">
              {formatDate(post.published_at ?? post.created_at)}
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl mt-2">{post.title}</h1>
          {post.excerpt && <p className="text-ink/60 mt-3 text-[15px]">{post.excerpt}</p>}
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/80">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
