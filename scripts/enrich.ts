/**
 * Enrichment agent — the ingestion pipeline in miniature.
 *
 * Reads messy product copy from data/raw/raw_products.json, uses Claude to
 * extract structured fabric composition, certifications, practice flags and
 * greenwash flags, computes the deterministic sustainability score with the
 * rubric in src/lib/scoring.ts, and writes data/products_seed.json.
 *
 * Run:  npx tsx scripts/enrich.ts
 * Env:  ANTHROPIC_API_KEY (read from .env.local)
 *
 * Resumable: products already present in the output file are skipped, so
 * re-runs only pay for what's missing.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { computeScore, validateCertifications } from "../src/lib/scoring";
import type { Practices, SeedProduct } from "../src/lib/types";
import { colorFamily, fitFor, sizesFor } from "./product-attrs";

config({ path: resolve(process.cwd(), ".env.local") });

const MODEL = "claude-sonnet-5";
const CONCURRENCY = 4;

const RAW_PATH = resolve(process.cwd(), "data/raw/raw_products.json");
const BRANDS_PATH = resolve(process.cwd(), "data/raw/brands.json");
const OUT_PATH = resolve(process.cwd(), "data/products_seed.json");

const materialEnum = z.enum([
  "organic_cotton", "recycled_cotton", "conventional_cotton", "bci_cotton",
  "linen", "hemp", "tencel_lyocell", "modal", "cupro", "viscose",
  "merino_wool", "lambswool", "recycled_wool", "virgin_wool", "peace_silk",
  "recycled_polyester", "polyester", "recycled_polyamide", "polyamide",
  "elastane", "other",
]);

const CANONICAL_CERTS = [
  "GOTS", "USDA Organic", "GRS", "Bluesign", "RWS", "European Flax", "OCS",
  "B Corp", "Fair Wear Foundation", "OEKO-TEX Standard 100", "SA8000", "FSC",
  "BCI", "1% for the Planet",
] as const;

const extractionSchema = z.object({
  fabric_composition: z
    .array(
      z.object({
        material: materialEnum,
        label: z.string().describe("Fibre name as written on the garment label, e.g. 'TENCEL™ Lyocell'"),
        pct: z.number().min(0).max(100),
      }),
    )
    .min(1)
    .describe("Every fibre in the garment with its percentage. Percentages must sum to 100. For multi-part garments (shell/lining/fill) merge into overall approximate percentages."),
  certifications: z
    .array(z.enum(CANONICAL_CERTS))
    .describe("Only certifications explicitly stated in the text. Do not infer."),
  practices: z.object({
    natural_dye: z.boolean(),
    undyed: z.boolean(),
    deadstock: z.boolean(),
    pfc_free: z.boolean(),
    repair_program: z.boolean(),
    take_back: z.boolean(),
    zero_waste: z.boolean(),
    made_to_order: z.boolean(),
  }),
  greenwash_flags: z
    .array(z.string())
    .describe("Vague sustainability claims in the copy that are NOT backed by a certification or a specific verifiable fact, e.g. 'eco-friendly fabric' with no certification. Empty array if none. Quote the claim briefly."),
  explanation: z
    .string()
    .describe("2–3 honest sentences for shoppers: what genuinely is sustainable about this garment and what its weak points are. No marketing fluff, no numeric score."),
});

interface RawProduct {
  slug: string; brand: string; title: string; category: string;
  gender: "men" | "women" | "unisex"; price: number; currency: string;
  retailer: string; color: string; image: string; raw_description: string;
}
interface RawBrand {
  slug: string; name: string; website: string; ethics_summary: string;
  certifications: string[]; ethics_modifier: number;
}

async function extractOne(p: RawProduct, brand: RawBrand): Promise<SeedProduct> {
  const { object } = await generateObject({
    model: anthropic(MODEL),
    schema: extractionSchema,
    system:
      "You are a textile sustainability analyst. Extract structured data from product copy precisely. " +
      "Never invent certifications or fibres not present in the text. Map fibres to the closest canonical material id " +
      "(e.g. 'ECONYL' → recycled_polyamide, 'TENCEL Modal' → modal, 'Ahimsa silk' → peace_silk, " +
      "'BCI cotton'/'Better Cotton' → bci_cotton, plain 'cotton' with no qualifier → conventional_cotton). " +
      "Be strict about greenwashing: uncertified vague claims like 'eco-friendly', 'planet-conscious', 'sustainably minded' get flagged.",
    prompt:
      `Brand: ${brand.name}\nBrand context: ${brand.ethics_summary}\n\n` +
      `Product: ${p.title} (${p.category})\nCopy:\n"""${p.raw_description}"""`,
  });

  // Guardrail: extractors can hallucinate certifications — only keep those
  // with textual evidence in the copy or the brand's own cert list.
  const certifications = validateCertifications(
    object.certifications,
    p.raw_description,
    brand.certifications,
  );

  const { score, grade, factors } = computeScore({
    fabric_composition: object.fabric_composition,
    certifications,
    practices: object.practices as Practices,
    brand_ethics_modifier: brand.ethics_modifier,
  });

  return {
    id: p.slug,
    brand_slug: brand.slug,
    title: p.title,
    description: p.raw_description,
    category: p.category,
    gender: p.gender,
    price: p.price,
    currency: p.currency,
    retailer: p.retailer,
    buy_url: `${brand.website}/products/${p.slug}`,
    image_url: `https://images.unsplash.com/${p.image}?auto=format&fit=crop&w=900&h=1200&q=80`,
    color: p.color,
    color_family: colorFamily(p.color),
    sizes: sizesFor(p.slug, p.category),
    fit: fitFor(p.title),
    fabric_composition: object.fabric_composition,
    sustainability: {
      score,
      grade,
      factors,
      explanation: object.explanation,
      greenwash_flags: object.greenwash_flags,
      certifications,
      practices: object.practices as Practices,
    },
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("✗ ANTHROPIC_API_KEY missing. Add it to .env.local first.");
    process.exit(1);
  }

  const raw: RawProduct[] = JSON.parse(readFileSync(RAW_PATH, "utf8")).products;
  const brands: RawBrand[] = JSON.parse(readFileSync(BRANDS_PATH, "utf8")).brands;
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));

  const existing: SeedProduct[] = existsSync(OUT_PATH)
    ? JSON.parse(readFileSync(OUT_PATH, "utf8")).products
    : [];
  const done = new Set(existing.map((p) => p.id));
  const todo = raw.filter((p) => !done.has(p.slug));

  console.log(`Catalog: ${raw.length} products · already enriched: ${done.size} · to do: ${todo.length}`);
  const results: SeedProduct[] = [...existing];
  let failed = 0;

  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((p) => {
        const brand = brandBySlug.get(p.brand);
        if (!brand) throw new Error(`Unknown brand ${p.brand} on ${p.slug}`);
        return extractOne(p, brand);
      }),
    );
    for (let j = 0; j < settled.length; j++) {
      const s = settled[j];
      if (s.status === "fulfilled") {
        results.push(s.value);
        console.log(`✓ ${s.value.id}  score=${s.value.sustainability.score} (${s.value.sustainability.grade})`);
      } else {
        failed++;
        console.error(`✗ ${batch[j].slug}: ${s.reason}`);
      }
    }
    // checkpoint after every batch so progress is never lost
    writeFileSync(OUT_PATH, JSON.stringify({ products: results }, null, 2));
  }

  console.log(`\nDone. ${results.length}/${raw.length} enriched, ${failed} failed.`);
  if (failed > 0) {
    console.log("Re-run the script to retry failures (already-enriched items are skipped).");
    process.exit(1);
  }
}

main();
