/**
 * LIVE INGESTION AGENT — pulls REAL products from real brand stores via
 * their public Shopify product feeds. Real titles, real photos, real prices,
 * REAL product URLs — so "view on brand site" lands on exactly that item.
 *
 * Only keeps products whose label discloses a full fibre composition
 * (the platform's honesty bar). Polite: small pages, backoff on 429/503.
 *
 * Run:  npx tsx scripts/ingest-live.ts
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeScore, validateCertifications } from "../src/lib/scoring";
import { mapCategory, parseComposition } from "../src/lib/live-ingest";
import { garmentType, genderFor } from "../src/lib/garment";
import type { Practices, SeedProduct } from "../src/lib/types";
import { colorFamily, fitFor } from "./product-attrs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export interface LiveSource {
  brandSlug: string;
  name: string;
  base: string;
  /**
   * What this brand sells, when its feed says nothing. Beaumont Organic,
   * Bibico and Lucy & Yak publish ZERO gender signal — no tag, no
   * product_type, nothing in the title — so per-item inference has nothing to
   * work with and everything fell through to "unisex", which surfaces
   * womenswear under the Men filter. That is knowledge about the brand, not
   * about the garment, so it is declared here. Omit it for feeds that do tag
   * gender (Thought, Komodo) and each item is judged on its own signal.
   */
  defaultGender?: "women" | "men";
}

/** Sources are data, not code — the Scout agent (scripts/grow.ts) appends here. */
function loadSources(): LiveSource[] {
  const p = resolve(process.cwd(), "data/raw/live-sources.json");
  return (JSON.parse(readFileSync(p, "utf8")) as { sources: LiveSource[] }).sources;
}
const SOURCES = loadSources();

const NO_PRACTICES: Practices = {
  natural_dye: false, undyed: false, deadstock: false, pfc_free: false,
  repair_program: false, take_back: false, zero_waste: false, made_to_order: false,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url: string, attempt = 1): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", "Accept-Language": "en-GB" },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 429 || res.status === 503) throw new Error(`throttled ${res.status}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    if (attempt >= 5) {
      console.log(`   giving up: ${url} (${e})`);
      return null;
    }
    const wait = attempt * 4000;
    console.log(`   ${e} — backing off ${wait / 1000}s`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
}

interface ShopifyProduct {
  title: string;
  handle: string;
  body_html: string;
  product_type: string;
  tags: string[] | string;
  images: Array<{ src: string }>;
  variants: Array<{ price: string; option1?: string | null }>;
  options?: Array<{ name: string; values: string[] }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function ingestBrand(src: (typeof SOURCES)[number], brandMeta: { certifications: string[]; ethics_modifier: number }) {
  const out: SeedProduct[] = [];
  let scanned = 0;
  for (let page = 1; page <= 40; page++) {
    const data = (await fetchJson(`${src.base}/products.json?limit=50&page=${page}`)) as
      | { products: ShopifyProduct[] }
      | null;
    if (!data?.products?.length) break;
    for (const p of data.products) {
      scanned++;
      // garments only — no masks, gift cards, or clearance oddities
      if (/face\s*cover|mask|gift\s*card|voucher|e-?card|repair\s*kit/i.test(p.title)) continue;
      const text = stripHtml(p.body_html ?? "");
      const composition = parseComposition(text);
      if (!composition) continue; // label doesn't disclose — skip, honestly
      if (!p.images?.[0]?.src || !p.variants?.[0]?.price) continue;

      const price = Math.round(parseFloat(p.variants[0].price));
      if (!Number.isFinite(price) || price < 5) continue;

      const certs = validateCertifications(
        ["GOTS", "USDA Organic", "GRS", "Bluesign", "RWS", "European Flax", "OCS", "B Corp", "Fair Wear Foundation", "OEKO-TEX Standard 100", "SA8000", "FSC", "BCI", "1% for the Planet"],
        text,
        [],
      );

      const { score, grade, factors } = computeScore({
        fabric_composition: composition,
        certifications: certs,
        practices: NO_PRACTICES,
        brand_ethics_modifier: brandMeta.ethics_modifier,
      });

      const tagStr = Array.isArray(p.tags) ? p.tags.join(" ") : String(p.tags ?? "");
      const sizeOpt = p.options?.find((o) => /size/i.test(o.name))?.values?.filter((v) => v.length <= 5) ?? [];
      const colourOpt = p.options?.find((o) => /colou?r/i.test(o.name))?.values?.[0];
      const colour = colourOpt ?? (p.title.includes("-") ? p.title.split("-").pop()!.trim() : "Multi");

      out.push({
        id: `live-${src.brandSlug}-${p.handle}`.slice(0, 80),
        brand_slug: src.brandSlug,
        title: p.title,
        description: text.slice(0, 600),
        category: mapCategory(p.product_type ?? "", p.title),
        // one gender authority — see genderFor in src/lib/garment.ts.
        // src.defaultGender is the LAST resort, used only when the title,
        // the garment type and the feed's own tags all say nothing.
        gender: genderFor(
          p.title,
          garmentType(p.title, p.product_type ?? ""),
          src.defaultGender,
          `${p.product_type ?? ""} ${tagStr}`,
        ),
        price,
        currency: "GBP",
        retailer: src.name,
        buy_url: `${src.base}/products/${p.handle}`,
        image_url: p.images[0].src.split("?")[0],
        color: colour,
        color_family: colorFamily(colour),
        sizes: sizeOpt.length ? sizeOpt : ["XS", "S", "M", "L"],
        fit: fitFor(p.title),
        source: "live",
        fabric_composition: composition,
        sustainability: {
          score,
          grade,
          factors,
          explanation: `Verified from ${src.name}'s own product page: ${composition.map((c) => `${c.pct}% ${c.label}`).join(", ")}.${certs.length ? ` Certifications stated: ${certs.join(", ")}.` : " No certifications stated on the page."}`,
          greenwash_flags: [],
          certifications: certs,
          practices: NO_PRACTICES,
        },
      });
    }
    console.log(`   page ${page}: scanned ${scanned}, kept ${out.length}`);
    await sleep(1000); // politeness
  }
  return { out, scanned };
}

/**
 * Harvest sources and return the garment-first balanced product list.
 * Pass `onlySlug` to ingest a single brand (the Scout's onboarding flow).
 */
export async function harvestAll(onlySlug?: string): Promise<SeedProduct[]> {
  const brands = new Map<string, { certifications: string[]; ethics_modifier: number }>(
    JSON.parse(readFileSync(resolve(process.cwd(), "data/raw/brands.json"), "utf8")).brands.map(
      (b: { slug: string }) => [b.slug, b],
    ),
  );

  const sources = onlySlug ? SOURCES.filter((s) => s.brandSlug === onlySlug) : SOURCES;
  const all: SeedProduct[] = [];
  for (const src of sources) {
    console.log(`▶ ${src.name} (${src.base})`);
    const meta = brands.get(src.brandSlug);
    if (!meta) { console.log("   no brand meta, skipping"); continue; }
    const { out, scanned } = await ingestBrand(src, meta);
    console.log(`   ✓ ${out.length}/${scanned} real products with disclosed composition`);
    all.push(...out);
  }

  // garment-first balance: Thought's feed is sock-heavy — cap accessories so
  // clothing searches surface real garments, not 100 sock variants
  const garments = all.filter((p) => p.category !== "accessories");
  const accessories = all.filter((p) => p.category === "accessories").slice(0, 40);
  return [...garments, ...accessories];
}

async function main() {
  const balanced = await harvestAll();
  writeFileSync(
    resolve(process.cwd(), "data/products_live.json"),
    JSON.stringify({ ingested_at: new Date().toISOString(), products: balanced }, null, 1),
  );
  console.log(`\n✓ TOTAL LIVE PRODUCTS: ${balanced.length} → data/products_live.json`);
  if (balanced.length > 0) {
    const s = balanced[0];
    console.log(`  sample: ${s.title} | £${s.price} | ${s.fabric_composition.map((c) => c.pct + "% " + c.material).join(", ")} | ${s.buy_url}`);
  }
}

// run only when invoked directly (the sentinel imports harvestAll instead)
if (process.argv[1]?.replace(/\\/g, "/").endsWith("ingest-live.ts")) {
  main();
}
