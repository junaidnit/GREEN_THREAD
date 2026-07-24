/**
 * One-off: apply demojibake() to every stored product description in
 * data/products_live.json. Fixes the "¬†"/"â€™" artifacts some feeds ship
 * without re-fetching anything. Idempotent.
 *
 * Run:  npx tsx scripts/clean-descriptions.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { demojibake } from "../src/lib/live-ingest";

const FILE = resolve(process.cwd(), "data/products_live.json");
const raw = JSON.parse(readFileSync(FILE, "utf8")) as { products: Array<{ description?: string }> };

let changed = 0;
for (const p of raw.products) {
  if (!p.description) continue;
  const cleaned = demojibake(p.description);
  if (cleaned !== p.description) {
    p.description = cleaned;
    changed++;
  }
}

writeFileSync(FILE, JSON.stringify(raw, null, 1));
console.log(`Cleaned ${changed} of ${raw.products.length} descriptions → ${FILE}`);
