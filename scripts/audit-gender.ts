/**
 * Gender integrity gate for the live catalogue.
 *
 * The men's section once held 339 Komodo women's pieces, because ingestion
 * reimplemented gender inference with an unanchored /menswear/ that matches
 * inside "womenswear". This asserts, against real data, that no garment
 * reading as womenswear is filed under men — and vice versa.
 *
 * Usage: npx tsx scripts/audit-gender.ts   (exits 1 on any leak)
 */
import { readFileSync } from "node:fs";
import { garmentType } from "../src/lib/garment";
import type { Product } from "../src/lib/types";

const raw = JSON.parse(readFileSync(new URL("../data/products_live.json", import.meta.url), "utf8"));
const products: Product[] = Array.isArray(raw) ? raw : raw.products;

const WOMENS_READ = /\b(women'?s?|ladies|bra|bralette|knickers|camisole|blouse|midi|maxi|pinafore|playsuit)\b/i;
const MENS_READ = /\b(men'?s?|menswear|gents)\b/i;
const WOMENS_ONLY_TYPES = new Set(["dress", "skirt", "blouse", "jumpsuit"]);

let failures = 0;
const report = (label: string, list: Product[]) => {
  console.log(`${list.length === 0 ? "✓" : "✗"} ${label}: ${list.length}`);
  for (const p of list.slice(0, 10)) console.log(`     ${p.brand?.slug ?? ""} · ${p.title}`);
  if (list.length) failures += list.length;
};

const men = products.filter((p) => p.gender === "men");
const women = products.filter((p) => p.gender === "women");

report(
  "women's wording filed under MEN",
  men.filter((p) => WOMENS_READ.test(p.title) && !MENS_READ.test(p.title)),
);
report(
  "women-only garment types filed under MEN",
  men.filter((p) => WOMENS_ONLY_TYPES.has(garmentType(p.title))),
);
report(
  "men's wording filed under WOMEN",
  women.filter((p) => MENS_READ.test(p.title) && !WOMENS_READ.test(p.title)),
);

const counts: Record<string, number> = {};
for (const p of products) counts[String(p.gender)] = (counts[String(p.gender)] ?? 0) + 1;
console.log(`\ncatalogue ${products.length} · ${JSON.stringify(counts)}`);

if (failures) {
  console.error(`\nFAILED: ${failures} gender leaks`);
  process.exit(1);
}
console.log("\nno gender leaks");
