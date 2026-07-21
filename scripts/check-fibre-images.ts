/**
 * Prints the photo each homepage fibre tile will show, using the SHIPPED
 * garment classifier — a quick way to confirm the fibre widget never falls
 * back to homeware, accessories or secondhand listings.
 * Usage: npx tsx scripts/check-fibre-images.ts
 */
import { readFileSync } from "node:fs";
import { garmentType, type GarmentType } from "../src/lib/garment";
import type { MaterialId, Product } from "../src/lib/types";

const SHOWS_CLOTH: Partial<Record<GarmentType, number>> = {
  dress: 6, jumpsuit: 6, coat: 5, jacket: 5, jumper: 5, cardigan: 5,
  shirt: 5, blouse: 5, skirt: 4, trousers: 4, dungarees: 4, gilet: 4,
  sweatshirt: 3, hoodie: 3, tee: 3, polo: 3, henley: 3, tank: 2, jeans: 2,
};
const SECONDHAND = /pre-?loved|second-?hand/i;
const dominant = (p: Product, m: MaterialId) =>
  [...p.fabric_composition].sort((a, b) => b.pct - a.pct)[0]?.material === m;
const pctOf = (p: Product, m: MaterialId) =>
  p.fabric_composition.find((f) => f.material === m)?.pct ?? 0;

const FIBRES: MaterialId[] = [
  "linen", "organic_cotton", "merino_wool", "peace_silk", "tencel_lyocell",
  "hemp", "modal", "viscose", "lambswool", "recycled_cotton",
];

async function main() {
// catalog.ts is server-only, so read the live catalog the way the other
// scripts do — the classifier below is still the shipped one
const raw = JSON.parse(
  readFileSync(new URL("../data/products_live.json", import.meta.url), "utf8")
);
const products: Product[] = Array.isArray(raw) ? raw : raw.products;
let shown = 0;
for (const m of FIBRES) {
  const best = products
    .filter((p) => p.image_url && dominant(p, m) && !SECONDHAND.test(p.title))
    .map((p) => ({ p, cloth: SHOWS_CLOTH[garmentType(p.title)] ?? 0 }))
    .filter((c) => c.cloth > 0)
    .map((c) => ({ ...c, score: c.cloth * 100 + pctOf(c.p, m) }))
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))[0];
  if (best) shown++;
  console.log(
    `${m.padEnd(17)} ${best ? `${String(pctOf(best.p, m)).padStart(3)}% · ${garmentType(best.p.title).padEnd(9)} · ${best.p.title}` : "— dropped (no garment photo) —"}`
  );
}
console.log(`\ntiles rendered: ${shown}/${FIBRES.length}`);
}

main();
