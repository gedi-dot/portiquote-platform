import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";
import { countryCode, REGIONS } from "@/lib/format";

export const revalidate = 3600; // refresh hourly

const u = (p: string) => `${SITE_URL}${p}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createPublicClient();

  const [{ data: fwds }, { data: posts }, { data: laneRows }] =
    await Promise.all([
      db
        .from("forwarder_companies")
        .select("slug, updated_at, hq_country")
        .eq("is_published", true)
        .limit(5000),
      db
        .from("posts")
        .select("slug, published_at")
        .eq("is_published", true)
        .limit(1000),
      db
        .from("forwarder_lanes")
        .select("origin_country, destination_country, forwarder_companies!inner(id)")
        .eq("forwarder_companies.is_published", true)
        .limit(5000),
    ]);

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: u("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: u("/directory"), changeFrequency: "daily", priority: 0.9 },
    { url: u("/countries"), changeFrequency: "weekly", priority: 0.8 },
    { url: u("/routes"), changeFrequency: "daily", priority: 0.9 },
    { url: u("/guides"), changeFrequency: "monthly", priority: 0.8 },
    { url: u("/get-quotes"), changeFrequency: "monthly", priority: 0.9 },
    { url: u("/guides/import-car-japan-kenya"), changeFrequency: "monthly", priority: 0.9 },
    { url: u("/guides/china-to-kenya-shipping"), changeFrequency: "monthly", priority: 0.9 },
    { url: u("/guides/fcl-vs-lcl"), changeFrequency: "monthly", priority: 0.8 },
    { url: u("/guides/incoterms"), changeFrequency: "monthly", priority: 0.8 },
    { url: u("/guides/container-specifications"), changeFrequency: "monthly", priority: 0.8 },
    { url: u("/guides/imdg-classes"), changeFrequency: "monthly", priority: 0.8 },
    { url: u("/news"), changeFrequency: "weekly", priority: 0.7 },
    { url: u("/pricing"), changeFrequency: "monthly", priority: 0.6 },
    { url: u("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: u("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: u("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  // Country pages: every African country (the brand promise) plus any country
  // that actually has supply — keeps thin pages out of the index.
  const countrySet = new Set<string>(REGIONS[0].countries);
  for (const f of fwds ?? []) if (f.hq_country) countrySet.add(f.hq_country);
  for (const l of laneRows ?? []) {
    countrySet.add(l.origin_country);
    countrySet.add(l.destination_country);
  }
  for (const name of countrySet) {
    entries.push({
      url: u(`/countries/${countryCode(name).toLowerCase()}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Lane pages: only corridors with at least one published forwarder.
  const laneSet = new Set<string>();
  for (const l of laneRows ?? []) {
    laneSet.add(
      `${countryCode(l.origin_country).toLowerCase()}-to-${countryCode(
        l.destination_country
      ).toLowerCase()}`
    );
  }
  for (const lane of laneSet) {
    entries.push({
      url: u(`/routes/${lane}`),
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  for (const f of fwds ?? []) {
    entries.push({
      url: u(`/forwarders/${f.slug}`),
      lastModified: f.updated_at ? new Date(f.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const p of posts ?? []) {
    entries.push({
      url: u(`/news/${p.slug}`),
      lastModified: p.published_at ? new Date(p.published_at) : undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
