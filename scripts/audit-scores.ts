/** Full audit: recompute every stored score from raw components and diff. */
import { readFileSync } from "node:fs";
import { computeScore } from "../src/lib/scoring";
import type { Practices, SeedProduct } from "../src/lib/types";

const brands = new Map<string, { ethics_modifier: number }>(
  JSON.parse(readFileSync("data/raw/brands.json", "utf8")).brands.map(
    (b: { slug: string; ethics_modifier: number }) => [b.slug, b],
  ),
);

let checked = 0, scoreErr = 0, gradeErr = 0, sumErr = 0, pctErr = 0;
const badIds: string[] = [];

for (const file of ["data/products_seed.json", "data/products_generated.json"]) {
  const products: SeedProduct[] = JSON.parse(readFileSync(file, "utf8")).products;
  for (const p of products) {
    checked++;
    const b = brands.get(p.brand_slug)!;
    const r = computeScore({
      fabric_composition: p.fabric_composition,
      certifications: p.sustainability.certifications,
      practices: p.sustainability.practices as Practices,
      brand_ethics_modifier: b.ethics_modifier,
    });
    if (r.score !== p.sustainability.score) { scoreErr++; badIds.push(`${p.id} score ${p.sustainability.score}→${r.score}`); }
    if (r.grade !== p.sustainability.grade) gradeErr++;
    const facSum = Math.round(p.sustainability.factors.reduce((s, f) => s + f.points, 0));
    if (facSum !== p.sustainability.score) { sumErr++; if (sumErr < 4) badIds.push(`${p.id} factors sum ${facSum} != ${p.sustainability.score}`); }
    const pctTotal = p.fabric_composition.reduce((s, f) => s + f.pct, 0);
    if (Math.abs(pctTotal - 100) > 1) pctErr++;
  }
}

console.log(`AUDIT — products checked: ${checked}`);
console.log(`score mismatches: ${scoreErr} | grade mismatches: ${gradeErr}`);
console.log(`factor-sum != score: ${sumErr} | compositions not 100%: ${pctErr}`);
if (badIds.length) console.log("examples:", badIds.slice(0, 5).join(" ; "));
console.log(badIds.length === 0 && scoreErr + gradeErr + sumErr + pctErr === 0 ? "✓ ALL CORRECT" : "✗ issues found");
