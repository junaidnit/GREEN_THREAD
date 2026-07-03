/**
 * One-off deterministic transform → UK market demo.
 * - Fictional brands → real UK high-street names (ILLUSTRATIVE demo data)
 * - Retailers → ASOS / John Lewis / Zalando / Brand Direct
 * - Prices INR → realistic GBP
 * - Adds size availability + colour families
 * Applies to data/raw/* and data/products_seed.json. No AI calls.
 *
 * Run:  npx tsx scripts/rebrand-uk.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BRAND_MAP: Record<string, { slug: string; name: string; website: string }> = {
  "terra-loom": { slug: "people-tree", name: "People Tree", website: "https://demo.greenthread.example/people-tree" },
  "north-fibre": { slug: "uniqlo", name: "Uniqlo", website: "https://demo.greenthread.example/uniqlo" },
  "salt-and-stem": { slug: "seasalt", name: "Seasalt Cornwall", website: "https://demo.greenthread.example/seasalt" },
  "reform-thread": { slug: "marks-and-spencer", name: "M&S", website: "https://demo.greenthread.example/ms" },
  "cedar-and-jade": { slug: "thought", name: "Thought", website: "https://demo.greenthread.example/thought" },
  "harvest-workwear": { slug: "patagonia", name: "Patagonia", website: "https://demo.greenthread.example/patagonia" },
  "mirien": { slug: "zara", name: "Zara", website: "https://demo.greenthread.example/zara" },
  "kanso-athletics": { slug: "sweaty-betty", name: "Sweaty Betty", website: "https://demo.greenthread.example/sweaty-betty" },
  "bloomfield-basics": { slug: "h-and-m", name: "H&M", website: "https://demo.greenthread.example/hm" },
  "atelier-ondes": { slug: "and-other-stories", name: "& Other Stories", website: "https://demo.greenthread.example/stories" },
  "moss-and-mountain": { slug: "finisterre", name: "Finisterre", website: "https://demo.greenthread.example/finisterre" },
  "juno-hemp-co": { slug: "cos", name: "COS", website: "https://demo.greenthread.example/cos" },
};

const RETAILER_MAP: Record<string, string> = {
  LeafMart: "ASOS",
  EcoBazaar: "John Lewis",
  GreenCart: "Zalando",
  "Brand Direct": "Brand Direct",
};

const COLOR_FAMILY: Array<[RegExp, string]> = [
  [/multi|3-pack|white\/grey\/black|mixed/i, "Multi"],
  [/stripe/i, "Blue"],
  [/black|charcoal|graphite|ink|midnight/i, "Black"],
  [/white|ecru|cream|natural|pearl|ivory|cloud|stone|oat|champagne|undyed/i, "White & Cream"],
  [/grey|heather|basalt|melange/i, "Grey"],
  [/navy|sky|blue|indigo|storm|teal|denim/i, "Blue"],
  [/moss|sage|olive|forest|pine|green|emerald/i, "Green"],
  [/clay|terracotta|rust|tobacco|walnut|camel|brown|sand|khaki|butter|duck/i, "Brown & Tan"],
  [/blush|pink|lilac|rose|dusty/i, "Pink & Purple"],
  [/coral|red|ember/i, "Red & Orange"],
  [/yellow/i, "Yellow"],
];

function colorFamily(color: string): string {
  for (const [re, fam] of COLOR_FAMILY) if (re.test(color)) return fam;
  return "Multi";
}

const SIZE_POOLS: Record<string, string[]> = {
  accessories: ["One size"],
  default: ["XS", "S", "M", "L", "XL"],
};

/** Deterministic per-product size availability: drop 0–2 sizes by slug hash. */
function sizesFor(slug: string, category: string): string[] {
  const pool = SIZE_POOLS[category] ?? SIZE_POOLS.default;
  if (pool.length === 1) return pool;
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const drop = h % 3; // 0, 1 or 2 sizes unavailable
  const out = [...pool];
  for (let i = 0; i < drop; i++) out.splice((h >> (3 * (i + 1))) % out.length, 1);
  return out;
}

function toGbp(inr: number): number {
  return Math.max(8, Math.round(inr / 100));
}

/* ── raw brands ── */
const brandsPath = resolve(process.cwd(), "data/raw/brands.json");
const brandsDoc = JSON.parse(readFileSync(brandsPath, "utf8"));
for (const b of brandsDoc.brands) {
  const m = BRAND_MAP[b.slug];
  if (!m) throw new Error(`No mapping for brand ${b.slug}`);
  b.slug = m.slug;
  b.name = m.name;
  b.website = m.website;
}
writeFileSync(brandsPath, JSON.stringify(brandsDoc, null, 2));
console.log(`✓ brands.json → ${brandsDoc.brands.map((b: { name: string }) => b.name).join(", ")}`);

/* ── raw products ── */
const rawPath = resolve(process.cwd(), "data/raw/raw_products.json");
const rawDoc = JSON.parse(readFileSync(rawPath, "utf8"));
for (const p of rawDoc.products) {
  p.brand = BRAND_MAP[p.brand]?.slug ?? p.brand;
  p.retailer = RETAILER_MAP[p.retailer] ?? p.retailer;
  p.price = toGbp(p.price);
  p.currency = "GBP";
}
writeFileSync(rawPath, JSON.stringify(rawDoc, null, 2));
console.log(`✓ raw_products.json → GBP + UK retailers`);

/* ── enriched seed ── */
const seedPath = resolve(process.cwd(), "data/products_seed.json");
const seedDoc = JSON.parse(readFileSync(seedPath, "utf8"));
for (const p of seedDoc.products) {
  const m = BRAND_MAP[p.brand_slug];
  if (!m) throw new Error(`No mapping for brand ${p.brand_slug}`);
  p.brand_slug = m.slug;
  p.retailer = RETAILER_MAP[p.retailer] ?? p.retailer;
  p.price = toGbp(p.price);
  p.currency = "GBP";
  p.buy_url = `${m.website}/products/${p.id}`;
  p.sizes = sizesFor(p.id, p.category);
  p.color_family = colorFamily(p.color);
}
writeFileSync(seedPath, JSON.stringify(seedDoc, null, 2));
console.log(`✓ products_seed.json → ${seedDoc.products.length} products (GBP, sizes, colour families)`);
