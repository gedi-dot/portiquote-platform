// Central site identity. All SEO metadata follows from here.
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? "PortiQuote";

// The registered entity, for the footer, terms and privacy. Kept separate
// from SITE_NAME because "PortiQuote Logistics" in every page title spends
// 20 characters of a ~60 character budget on the brand before Google has
// seen a single word about the page.
export const SITE_LEGAL_NAME = "PortiQuote Logistics";

// The site's canonical public address, and the only value here baked in at
// build time. Canonical and Open Graph URLs are written into statically
// rendered HTML, so they cannot vary per container — meaning this is always
// production's address, including inside the staging container. That is
// deliberate: staging is noindex and behind basic auth, so it must never
// advertise itself as canonical. Anything a user actually follows back into the
// app — email links, payment returns — uses appOrigin() from lib/runtime.ts.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Post a shipment once and let vetted African freight forwarders compete — " +
  "ocean, air, road and RoRo across all 54 African countries, on lanes to " +
  "Europe, Asia, the Middle East and the Americas.";
