/**
 * Fold today's catalog into the append-only truth ledger.
 * Run manually (`npm run truth`) or chained after ingest/sentinel so the
 * ledger deepens automatically. Only new/changed observations are appended.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { recordObservations, type TruthLedger } from "../src/lib/truth-ledger";
import type { SeedProduct } from "../src/lib/types";

const LEDGER_PATH = resolve(process.cwd(), "data/truth-ledger.json");

const read = (f: string): SeedProduct[] =>
  existsSync(resolve(process.cwd(), f))
    ? JSON.parse(readFileSync(resolve(process.cwd(), f), "utf8")).products
    : [];

function main() {
  const products = [
    ...read("data/products_live.json"),
    ...read("data/products_seed.json"),
    ...read("data/products_generated.json"),
  ];

  const prev: TruthLedger = existsSync(LEDGER_PATH)
    ? JSON.parse(readFileSync(LEDGER_PATH, "utf8"))
    : { recorded_at: "", entries: [] };

  const today = new Date().toISOString().slice(0, 10);
  const { ledger, added, changed, firstSeen } = recordObservations(
    prev,
    products.map((p) => ({
      id: p.id,
      brand_slug: p.brand_slug,
      title: p.title,
      fabric_composition: p.fabric_composition,
      source: p.source,
      sustainability: { score: p.sustainability.score, grade: p.sustainability.grade },
    })),
    today,
  );

  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 0));

  const misnamed = ledger.entries.filter((e) => e.observed_at === today && e.misnamed).length;
  console.log(`▶ truth ledger — ${today}`);
  console.log(`  products observed:   ${products.length}`);
  console.log(`  first-seen (new):    ${firstSeen}`);
  console.log(`  changed since last:  ${changed}`);
  console.log(`  entries appended:    ${added}`);
  console.log(`  total ledger size:   ${ledger.entries.length}`);
  console.log(`  misnamed today:      ${misnamed} (greenwash flags on record)`);
  console.log(`✓ data/truth-ledger.json`);
}

main();
