// Central site identity. When the final company name is chosen, update
// NEXT_PUBLIC_SITE_NAME (and UI strings) — all SEO metadata follows from here.
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "N.K. Gedi & Co.";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Post a shipment once and let vetted African freight forwarders compete — " +
  "ocean, air, road and RoRo across all 54 African countries, on lanes to " +
  "Europe, Asia, the Middle East and the Americas.";
