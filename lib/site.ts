// Central site identity. All SEO metadata follows from here.
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "PortiQuote";

// The registered entity, for the footer, terms and privacy. Kept separate
// from SITE_NAME because "PortiQuote Logistics" in every page title spends
// 20 characters of a ~60 character budget on the brand before Google has
// seen a single word about the page.
export const SITE_LEGAL_NAME = "PortiQuote Logistics";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Post a shipment once and let vetted African freight forwarders compete — " +
  "ocean, air, road and RoRo across all 54 African countries, on lanes to " +
  "Europe, Asia, the Middle East and the Americas.";
