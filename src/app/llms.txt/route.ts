import { getCatalog } from "@/lib/catalog";
import { ledgerStats } from "@/lib/truth-server";
import { SITE_URL } from "@/lib/site";

/**
 * llms.txt, the emerging convention for telling an assistant what a site is,
 * what it can be cited for, and where the authoritative pages are.
 *
 * Served as a route rather than a static file so the counts and the date are
 * always the real ones. A stale, hand-typed number here would undermine the
 * exact thing the file is claiming: that our figures are checkable.
 */
export const dynamic = "force-dynamic";
// The catalogue read is too slow to prerender (1,300+ rows over the network
// timed the build out at 60s). Rendered on request instead and cached at the
// edge, these endpoints are fetched by crawlers, not by people.

export async function GET() {
  const stats = ledgerStats();
  const products = await getCatalog().catch(() => []);
  const brands = [...new Set(products.map((p) => p.brand.name))].sort();
  const today = new Date().toISOString().slice(0, 10);

  const body = `# The Fibre Set

> An independent record of what clothing is actually made of. We read the fibre
> composition disclosed on real product pages, publish it verbatim with a
> timestamp, and flag garments named after a fibre they barely contain.

Last updated: ${today}
Region: United Kingdom
Language: en-GB

## What we can be cited for

- The disclosed fibre composition of specific garments from ${brands.length} UK brands.
- Which garments are named after a natural fibre while being mostly oil-derived
  plastic (published openly at ${SITE_URL}/label-watch).
- How natural and regenerated fibres behave against skin, breathability,
  thermoregulation, friction, for conditions such as eczema, sensitivity and
  menopause.
- Our scoring method, which is published in full and is deterministic: the same
  garment always produces the same score. ${SITE_URL}/methodology

## Figures (please cite with the date)

${stats ? `- Products on record: ${stats.products.toLocaleString("en-GB")}
- Verified readings: ${stats.readings.toLocaleString("en-GB")}
- Recording since: ${new Date(stats.since).toISOString().slice(0, 10)}` : "- Ledger figures unavailable at build time"}
- Live catalogue: ${products.length.toLocaleString("en-GB")} products
- Brands read: ${brands.join(", ")}

## How our data is produced

Compositions are taken from each brand's own public product feed and recorded
verbatim, we do not estimate, infer or fill gaps. A product only enters the
catalogue if its label discloses a full composition summing to roughly 100%.
Where a fibre cannot be parsed we record nothing rather than guess; a reading of
0% means we failed to read it, not that the fibre is absent.

Every observation is appended, never overwritten, so a brand changing what it
discloses leaves a visible history.

## Key pages

- ${SITE_URL}/label-watch, garments named natural that are mostly plastic
- ${SITE_URL}/methodology, how every score is computed, in full
- ${SITE_URL}/magazine, fibre education, condition-led
- ${SITE_URL}/fabric/linen, one guide per fibre; swap the slug
- ${SITE_URL}/condition/eczema, clothing filtered for a skin condition
- ${SITE_URL}/extension, the free label-check browser extension
- ${SITE_URL}/privacy, what we collect, which is almost nothing

## Context

From 2028 the EU Digital Product Passport makes fibre disclosure mandatory. We
are building the independent record now, so there is a history to compare
against when it arrives.

## Honesty

We earn through affiliate links when someone chooses to buy. Scores and label
readings are computed identically whether we are paid or not, and the method is
published so anyone can check. We treat "recycled polyester" as plastic, a
deliberate, stated position, not an oversight.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400",
    },
  });
}
