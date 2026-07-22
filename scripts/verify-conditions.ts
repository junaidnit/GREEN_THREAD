/** Full-catalog proof that the two condition filters are correct. Read-only. */
import { existsSync, readFileSync } from "node:fs";
import { CONDITIONS, CONDITION_SLUGS, isConditionSafe } from "../src/lib/conditions";
import type { SeedProduct } from "../src/lib/types";

const read = (f: string): SeedProduct[] =>
  existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).products : [];
const all = read("data/products_live.json").filter((p) => p.source === "live");

const WOOL = new Set(["merino_wool", "lambswool", "recycled_wool", "virgin_wool"]);
const SYN = new Set(["polyester", "recycled_polyester", "polyamide", "recycled_polyamide", "elastane"]);

const eczemaSafe = all.filter((p) => isConditionSafe(p.fabric_composition, "eczema"));
const allergySafe = all.filter((p) => isConditionSafe(p.fabric_composition, "synthetic-fibre-allergy"));

const eczemaHasWool = eczemaSafe.filter((p) => p.fabric_composition.some((f) => WOOL.has(f.material)));
const eczemaHasSyn = eczemaSafe.filter((p) => p.fabric_composition.some((f) => SYN.has(f.material)));
const allergyHasSyn = allergySafe.filter((p) => p.fabric_composition.some((f) => SYN.has(f.material)));
const allergyWoolItems = allergySafe.filter((p) => p.fabric_composition.some((f) => WOOL.has(f.material)));

console.log(`catalog: ${all.length} products`);
console.log(`\neczema-safe list: ${eczemaSafe.length} products`);
console.log(`  ${eczemaHasWool.length === 0 ? "✓" : "✗ FAIL"} zero wool leaked in: ${eczemaHasWool.length}`);
console.log(`  ${eczemaHasSyn.length === 0 ? "✓" : "✗ FAIL"} zero synthetic leaked in: ${eczemaHasSyn.length}`);

console.log(`\nsynthetic-fibre-allergy-safe list: ${allergySafe.length} products`);
console.log(`  ${allergyHasSyn.length === 0 ? "✓" : "✗ FAIL"} zero synthetic leaked in: ${allergyHasSyn.length}`);
console.log(`  ✓ wool items correctly INCLUDED (proves the nuance): ${allergyWoolItems.length}`);
if (allergyWoolItems[0]) console.log(`    e.g. "${allergyWoolItems[0].title}" — ${allergyWoolItems[0].fabric_composition.map((f) => f.pct + "% " + f.material).join(", ")}`);

const woolNotInEczema = allergyWoolItems.filter((p) => !eczemaSafe.some((e) => e.id === p.id));
console.log(`  ✓ those same wool items correctly EXCLUDED from eczema: ${woolNotInEczema.length}/${allergyWoolItems.length}`);

let failed = eczemaHasWool.length + eczemaHasSyn.length + allergyHasSyn.length + (allergyWoolItems.length - woolNotInEczema.length);

/**
 * Generic proof for EVERY registered condition, so adding one to the registry
 * can never ship an unverified filter. Each rule declares an allow-set; the
 * only correct behaviour is that nothing on a condition's list contains a
 * fibre outside it.
 */
console.log("\nevery condition, against the full catalogue:");
for (const slug of CONDITION_SLUGS) {
  const rule = CONDITIONS[slug];
  const safe = all.filter((p) => isConditionSafe(p.fabric_composition, slug));
  const leaks = safe.filter((p) => p.fabric_composition.some((f) => !rule.allow.has(f.material)));
  const woolIn = safe.filter((p) => p.fabric_composition.some((f) => WOOL.has(f.material))).length;
  failed += leaks.length;
  console.log(
    `  ${leaks.length === 0 ? "✓" : "✗ FAIL"} ${slug.padEnd(24)} ${String(safe.length).padStart(5)} products` +
      `  leaks: ${leaks.length}` +
      `  wool: ${woolIn > 0 ? `in (${woolIn})` : "out"}`,
  );
  if (safe.length === 0) {
    console.log(`      ! matches nothing: a condition page with an empty list is worse than no page`);
    failed++;
  }
}

console.log(`\n${failed === 0 ? "✓ ALL CORRECTNESS CHECKS PASS" : `✗ ${failed} FAILURE(S)`}`);
process.exit(failed === 0 ? 0 : 1);
