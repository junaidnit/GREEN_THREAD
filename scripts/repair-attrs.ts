/**
 * Data-repair pass: rewrites the stored `color`, `color_family` and `gender`
 * fields to match what the title actually says, using the garment engine.
 *
 * The matcher derives these at runtime, so recommendations were already
 * correct — but the search sidebar's colour/gender facets and the card
 * labels read the STORED fields, which the feeds get wrong constantly
 * (a pink camisole stored as "Black", 42 dresses tagged "men", 138 colour
 * fields holding a whole product title).
 *
 *   npx tsx scripts/repair-attrs.ts          # report only
 *   npx tsx scripts/repair-attrs.ts --write  # rewrite the JSON files
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { colourFamily, colourWord, garmentType, genderFor } from "../src/lib/garment";
import type { SeedProduct } from "../src/lib/types";

const WRITE = process.argv.includes("--write");
const FILES = ["data/products_live.json", "data/products_seed.json", "data/products_generated.json"];

let colourFixed = 0;
let familyFixed = 0;
let genderFixed = 0;
const samples: string[] = [];

for (const rel of FILES) {
  const path = resolve(process.cwd(), rel);
  if (!existsSync(path)) continue;
  const doc = JSON.parse(readFileSync(path, "utf8")) as { products: SeedProduct[] };

  for (const p of doc.products) {
    const type = garmentType(p.title, p.category);

    // colour: prefer the title's colour word; keep a sane stored colour only
    // if it's a short real colour and the title names nothing
    const titleColour = colourWord(p.title);
    const storedIsClean = p.color && p.color.split(/\s+/).length <= 2 && colourWord(p.color) !== null;
    const newColour = titleColour ?? (storedIsClean ? p.color : "");
    const newFamily = colourFamily(p.title, newColour) ?? "Multi";
    const newGender = genderFor(p.title, type, p.gender);

    if (newColour && newColour !== p.color) {
      if (samples.length < 10) samples.push(`  colour  "${p.title}"  ${p.color} → ${newColour}`);
      p.color = newColour;
      colourFixed++;
    }
    if (newFamily !== p.color_family) {
      if (samples.length < 20 && /Black|Multi/.test(p.color_family) && newFamily.startsWith("Pink"))
        samples.push(`  family  "${p.title}"  ${p.color_family} → ${newFamily}`);
      p.color_family = newFamily;
      familyFixed++;
    }
    if (newGender !== p.gender) {
      if (samples.length < 30) samples.push(`  gender  "${p.title}"  ${p.gender} → ${newGender}`);
      p.gender = newGender;
      genderFixed++;
    }
  }

  if (WRITE) writeFileSync(path, JSON.stringify(doc, null, 1));
}

console.log(`colour fields corrected:  ${colourFixed}`);
console.log(`colour_family corrected:  ${familyFixed}`);
console.log(`gender corrected:         ${genderFixed}`);
console.log(`\nsamples:\n${samples.join("\n")}`);
console.log(WRITE ? "\n✓ files rewritten" : "\n(dry run — pass --write to apply)");
