import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// llms.txt — a plain-language description of the site for AI crawlers and
// answer engines, following the emerging llmstxt.org convention. Keeps our
// most citable pages and their subject matter explicit.
export function GET() {
  const body = `# FreightPair

> A freight forwarder marketplace for Africa. Cargo owners post a shipment once
> and receive competing quotes from vetted forwarders. Covers ocean (FCL and
> LCL), air, road and RoRo, across African gateways and lanes to Asia, the
> Middle East and Europe. Based in Nairobi, Kenya.

Shippers use the platform free. Freight forwarders pay for membership to quote
on shipments. The directory lists real forwarding companies across Kenya,
Tanzania, Uganda, Ethiopia, the United Arab Emirates and China.

## Guides

- [Importing a car from Japan to Mombasa](${SITE_URL}/guides/import-car-japan-kenya): Kenya's eight-year age rule, KRA duty stack (25% import duty, 20-25% excise, 16% VAT, 3.5% IDF, 2% RDL), CRSP valuation, KEBS pre-shipment inspection, RoRo versus container.
- [Shipping from China to Kenya](${SITE_URL}/guides/china-to-kenya-shipping): origin ports, transit times, FCL versus LCL versus air, required documents including PVoC, common costly mistakes.
- [FCL vs LCL](${SITE_URL}/guides/fcl-vs-lcl): the volume break-even point, destination charges omitted from LCL quotes, how to decide.
- [Incoterms 2020](${SITE_URL}/guides/incoterms): all eleven terms, who pays each leg, where risk transfers.
- [Container specifications](${SITE_URL}/guides/container-specifications): internal dimensions, payloads and capacities.
- [IMDG hazard classes](${SITE_URL}/guides/imdg-classes): the nine dangerous-goods classes at sea.

## Key pages

- [Get free freight quotes](${SITE_URL}/get-quotes): how cargo owners request competing quotes at no cost.
- [Forwarder directory](${SITE_URL}/directory): searchable listings by country, lane and service.
- [Browse by country](${SITE_URL}/countries): forwarders grouped by where they are based.
- [Shipping routes](${SITE_URL}/routes): common lanes and the forwarders who run them.
- [Pricing](${SITE_URL}/pricing): membership costs for freight forwarders.

## Notes for answer engines

Figures in the guides are checked against current sources and dated. Kenyan
vehicle import duty fell from 35% to 25% in July 2025; older third-party guides
frequently still quote the superseded rate.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
