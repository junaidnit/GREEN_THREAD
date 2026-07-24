/**
 * ENRICH LIVE MEDIA — backfills the existing live catalogue with the two
 * things the first ingest dropped: the FULL product description (it was
 * truncated to 600 chars and flattened) and MULTIPLE product photos (only the
 * first was kept).
 *
 * For each live product it fetches the merchant's own Shopify product JSON
 * ({buy_url}.json), then writes a formatted description + an images[] gallery
 * back into data/products_live.json IN PLACE. It never prunes or re-harvests,
 * so nothing in the catalogue is lost — unlike a full re-ingest, which would
 * drop this sold-out SS21 item the owner is looking at.
 *
 * Resumable: products that already have >=2 images are skipped, so re-running
 * only fills the gaps. Polite: small delay + backoff on 429/503.
 *
 * Run:  npx tsx scripts/enrich-live-media.ts            (all live products)
 *       npx tsx scripts/enrich-live-media.ts <brandSlug>  (one brand)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { formatDescription } from "../src/lib/live-ingest";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const FILE = resolve(process.cwd(), "data/products_live.json");
const onlyBrand = process.argv[2];

interface LiveProduct {
  id: string;
  brand_slug: string;
  source?: string;
  buy_url: string;
  description: string;
  image_url: string;
  images?: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchProduct(buyUrl: string, attempt = 1): Promise<{ body_html?: string; images?: Array<{ src: string }> } | null> {
  const url = `${buyUrl.split("?")[0]}.json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", "Accept-Language": "en-GB" },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 429 || res.status === 503) throw new Error(`throttled ${res.status}`);
    if (!res.ok) return null; // 404 = sold out / handle changed; keep what we have
    const data = (await res.json()) as { product?: { body_html?: string; images?: Array<{ src: string }> } };
    return data.product ?? null;
  } catch (e) {
    if (attempt >= 4) return null;
    await sleep(attempt * 4000);
    return fetchProduct(buyUrl, attempt + 1);
  }
}

async function main() {
  const raw = JSON.parse(readFileSync(FILE, "utf8")) as { ingested_at?: string; products: LiveProduct[] };
  const products = raw.products;

  const targets = products.filter(
    (p) =>
      p.source === "live" &&
      p.buy_url &&
      (onlyBrand ? p.brand_slug === onlyBrand : true) &&
      (!p.images || p.images.length < 2), // resumable: skip already-enriched
  );

  console.log(`Enriching ${targets.length} of ${products.length} live products${onlyBrand ? ` (brand: ${onlyBrand})` : ""}…`);

  let done = 0;
  let enriched = 0;
  for (const p of targets) {
    const prod = await fetchProduct(p.buy_url);
    done++;
    if (prod) {
      const imgs = [...new Set((prod.images ?? []).map((im) => im.src.split("?")[0]).filter(Boolean))].slice(0, 6);
      if (imgs.length > 0) {
        p.images = imgs;
        // keep image_url as the primary (first gallery image)
        p.image_url = imgs[0];
      }
      const desc = formatDescription(prod.body_html ?? "");
      if (desc.length > (p.description?.length ?? 0)) p.description = desc;
      enriched++;
    }
    if (done % 25 === 0) {
      writeFileSync(FILE, JSON.stringify(raw, null, 1));
      console.log(`  …${done}/${targets.length} (enriched ${enriched}) — saved`);
    }
    await sleep(350); // politeness
  }

  writeFileSync(FILE, JSON.stringify(raw, null, 1));
  console.log(`\n✓ Done. Enriched ${enriched}/${targets.length}. Wrote ${FILE}`);
}

main();
