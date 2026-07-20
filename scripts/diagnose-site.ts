/**
 * Whole-site health sweep — data integrity, matcher leaks, link shape.
 * Read-only. Run: npx tsx scripts/diagnose-site.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { garmentType, genderFor, colourFamily } from "../src/lib/garment";
import { rankSameButBetter } from "../src/lib/match";
import { oilDerivedPct } from "../src/lib/materials";
import { computeScore } from "../src/lib/scoring";
import type { SeedProduct } from "../src/lib/types";

const read = (f: string): SeedProduct[] =>
  existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).products : [];
// real products only — the catalog is live-feed items exclusively
const all = read("data/products_live.json").filter((p) => p.source === "live");

let hardFails = 0;
const bad = (label: string, items: string[]) => {
  if (items.length > 0) hardFails += items.length;
  console.log(`\n${items.length === 0 ? "✓" : "✗"} ${label}: ${items.length}`);
  for (const s of items.slice(0, 6)) console.log(`    · ${s}`);
};

console.log(`catalog: ${all.length} real products (live feeds only)`);

// 1. duplicate ids
const ids = new Map<string, number>();
for (const p of all) ids.set(p.id, (ids.get(p.id) ?? 0) + 1);
bad("duplicate ids", [...ids].filter(([, n]) => n > 1).map(([id, n]) => `${id} ×${n}`));

// 2. image url shape
bad(
  "missing/blank image_url",
  all.filter((p) => !p.image_url || !/^https?:\/\//.test(p.image_url)).map((p) => p.id),
);

// 3. buy_url shape — every product is a real listing
bad(
  "items with a non-http buy_url",
  all.filter((p) => !/^https?:\/\/.+\/products\/.+/.test(p.buy_url)).map((p) => `${p.id} → ${p.buy_url}`),
);

// 4. composition sums to ~100
bad(
  "composition not summing to 95–105%",
  all
    .filter((p) => {
      const t = p.fabric_composition.reduce((s, f) => s + f.pct, 0);
      return t < 95 || t > 105;
    })
    .map((p) => `${p.id} (${p.fabric_composition.reduce((s, f) => s + f.pct, 0)}%)`),
);

// 5. score correctness (recompute, compare)
let scoreDrift = 0;
for (const p of all) {
  const { score } = computeScore({
    fabric_composition: p.fabric_composition,
    certifications: p.sustainability.certifications,
    practices: p.sustainability.practices,
    brand_ethics_modifier: 0,
  });
  // brand modifier isn't stored per-item here, so allow a wide band; flag only wild drift
  if (Math.abs(score - p.sustainability.score) > 12) scoreDrift++;
}
console.log(`\n${scoreDrift === 0 ? "✓" : "⚠"} score drift >12pts (excl. brand modifier): ${scoreDrift}`);

// 6. gender still wrong by garment type
bad(
  "women-only garment types tagged men",
  all
    .filter((p) => /\b(dress|skirt|camisole|bralette|blouse|jumpsuit)\b/i.test(p.title) && p.gender === "men")
    .map((p) => p.title),
);

// 7. matcher: cross-type or cross-gender leaks over a broad sample
let typeLeaks = 0;
let genderLeaks = 0;
let emptyForPlastic = 0;
const plasticItems = all.filter((p) => oilDerivedPct(p.fabric_composition) >= 20);
const sample = plasticItems.filter((_, i) => i % 7 === 0); // ~1/7 of plastic items
for (const t of sample) {
  const { matches } = rankSameButBetter(t, all, { limit: 4 });
  if (matches.length === 0) { emptyForPlastic++; continue; }
  const tType = garmentType(t.title, t.category);
  const tGender = genderFor(t.title, tType, t.gender);
  for (const m of matches) {
    if (garmentType(m.item.title, m.item.category) !== tType) typeLeaks++;
    const mg = genderFor(m.item.title, garmentType(m.item.title, m.item.category), m.item.gender);
    if (!(tGender === "unisex" || mg === "unisex" || tGender === mg)) genderLeaks++;
  }
}
hardFails += typeLeaks + genderLeaks + scoreDrift;
console.log(`\nmatcher sample: ${sample.length} plastic items checked`);
console.log(`  ${typeLeaks === 0 ? "✓" : "✗"} cross-garment-type recommendations: ${typeLeaks}`);
console.log(`  ${genderLeaks === 0 ? "✓" : "✗"} cross-gender recommendations:     ${genderLeaks}`);
console.log(`  ⓘ plastic items with NO same-item match: ${emptyForPlastic}/${sample.length} (${Math.round((emptyForPlastic / sample.length) * 100)}%)`);

// ── informational warnings (do NOT fail the gate) ──
const noColour = all.filter((p) => colourFamily(p.title, p.color) === null).length;
console.log(`\nⓘ items with no derivable colour: ${noColour} (${Math.round((noColour / all.length) * 100)}%)`);
const other = all.filter((p) => garmentType(p.title, p.category) === "other");
console.log(`ⓘ unidentified garment type: ${other.length}`);
for (const p of other.slice(0, 6)) console.log(`    · ${p.title}`);

// ── the gate ──
console.log(
  `\n${hardFails === 0 ? "✓ ALL HARD CHECKS PASS" : `✗ ${hardFails} HARD FAILURE(S)`}`,
);
process.exit(hardFails === 0 ? 0 : 1);
