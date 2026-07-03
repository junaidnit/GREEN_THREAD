/**
 * Deterministic re-validation of the enriched seed — no AI calls.
 * Dedupes + evidence-checks certifications and recomputes scores/factors.
 * Run after changing the rubric or validation rules:  npx tsx scripts/validate-seed.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeScore, validateCertifications } from "../src/lib/scoring";
import type { Brand, SeedProduct } from "../src/lib/types";

const SEED_PATH = resolve(process.cwd(), "data/products_seed.json");
const RAW_PATH = resolve(process.cwd(), "data/raw/raw_products.json");
const BRANDS_PATH = resolve(process.cwd(), "data/raw/brands.json");

const seed: { products: SeedProduct[] } = JSON.parse(readFileSync(SEED_PATH, "utf8"));
const raw: Array<{ slug: string; raw_description: string }> = JSON.parse(
  readFileSync(RAW_PATH, "utf8"),
).products;
const brands: Brand[] = JSON.parse(readFileSync(BRANDS_PATH, "utf8")).brands;

const rawById = new Map(raw.map((r) => [r.slug, r.raw_description]));
const brandBySlug = new Map(brands.map((b) => [b.slug, b]));

let changed = 0;
for (const p of seed.products) {
  const brand = brandBySlug.get(p.brand_slug)!;
  const rawText = rawById.get(p.id) ?? p.description;

  // label hygiene: strip stray leading percentages ("100% Linen" → "Linen")
  for (const f of p.fabric_composition) {
    const cleaned = f.label.replace(/^\s*\d+\s*%\s*/, "");
    if (cleaned !== f.label) {
      f.label = cleaned;
      changed++;
      console.log(`~ ${p.id}: label cleaned → "${cleaned}"`);
    }
  }

  const validCerts = validateCertifications(
    p.sustainability.certifications,
    rawText,
    brand.certifications,
  );

  const { score, grade, factors } = computeScore({
    fabric_composition: p.fabric_composition,
    certifications: validCerts,
    practices: p.sustainability.practices,
    brand_ethics_modifier: brand.ethics_modifier,
  });

  const certsChanged =
    JSON.stringify(validCerts) !== JSON.stringify(p.sustainability.certifications);
  if (certsChanged || score !== p.sustainability.score) {
    console.log(
      `~ ${p.id}: score ${p.sustainability.score}→${score}` +
        (certsChanged
          ? `  certs [${p.sustainability.certifications}] → [${validCerts}]`
          : ""),
    );
    changed++;
  }

  p.sustainability.certifications = validCerts;
  p.sustainability.score = score;
  p.sustainability.grade = grade;
  p.sustainability.factors = factors;
}

writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2));
console.log(`\n✓ Revalidated ${seed.products.length} products, ${changed} corrected.`);
