/**
 * Proves the image read: does the vision call name the garment's real colour
 * and pattern from its photo? This is the signal the matcher was missing.
 *   npx tsx scripts/proof-visual-attrs.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve(process.cwd(), ".env.local") });

import { visualAttributes } from "../src/lib/extract";
import { colourFamilies } from "../src/lib/garment";

async function main() {
  const cases: Array<{ what: string; url: string }> = [
    {
      what: "Uniqlo olive utility jacket (its title names no colour)",
      url: "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/459592/item/goods_56_459592_3x4.jpg",
    },
  ];

  // real catalogue photos, where the title tells us the right answer
  const live = JSON.parse(readFileSync("data/products_live.json", "utf8")).products as Array<{
    title: string;
    image_url: string;
  }>;
  for (const t of ["Stripe", "Check", "Pink", "Black"]) {
    const hit = live.find((p) => new RegExp(`\\b${t}`, "i").test(p.title));
    if (hit) cases.push({ what: `catalogue: ${hit.title}`, url: hit.image_url });
  }

  for (const c of cases) {
    const attrs = await visualAttributes(c.url);
    const fams = [...colourFamilies(attrs.colour ?? "")];
    console.log(`\n${c.what}`);
    console.log(`   colour: ${attrs.colour ?? "(none)"}  →  family: ${fams.join(", ") || "(unmapped)"}`);
    console.log(`   pattern: ${attrs.pattern}`);
  }
}

main();
