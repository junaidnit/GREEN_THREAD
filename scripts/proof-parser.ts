/** Which real, clearly-disclosed compositions does parseComposition reject? */
import { parseComposition } from "../src/lib/live-ingest";

const SHOULD_PARSE = [
  "the right balance of durability and ease, for a clean, natural fit. 99% Cotton, 1% Elastane Barrel Leg 11oz Stretch Denim",
  "CS-Code: 9131 • 70% Cotton, 30% Euroflax Linen • Boat Neck • Relaxed Fit • Drop shoulder",
  "for a versatile piece that complements a natural, confident wardrobe. 100% Cotton V neck Topstitching detail Notch neck design",
  "blends comfort with enduring quality. 100% Cotton Collared Relaxed fit Exclusive brand yarn",
  "Composition: 100% Organic Cotton",
  "95% Organic Cotton, 5% Elastane",
  "Made from 100% British Wool",
  "Fabric: 60% Linen 40% Cotton",
  "100% Cotton.",
  "· 100% Cotton ·",
  "70% TENCEL™ Lyocell 30% Organic Cotton",
  "Shell: 100% Cotton / Lining: 100% Polyester",
];

/** Must NOT be read as a composition — the honesty bar cuts both ways. */
const SHOULD_REJECT = [
  "Save 50% off everything this weekend",
  "Now 30% off — final reductions",
  "A lovely soft dress, free returns within 30 days",
  "Rated 100% by our customers",
  "Only 40% of our range is on sale",
];

console.log("SHOULD PARSE");
let bad = 0;
for (const t of SHOULD_PARSE) {
  const out = parseComposition(t);
  if (!out) bad++;
  console.log(out ? `  ✓ ${out.map((p) => `${p.pct}% ${p.material}`).join(", ")}` : `  ✗ REJECTED  <- ${t.slice(0, 60)}`);
}

console.log("\nSHOULD REJECT (false-positive guard)");
for (const t of SHOULD_REJECT) {
  const out = parseComposition(t);
  if (out) bad++;
  console.log(out ? `  ✗ WRONGLY PARSED as ${JSON.stringify(out)}  <- ${t}` : `  ✓ ignored  <- ${t}`);
}

console.log(bad === 0 ? "\nALL GOOD" : `\n${bad} PROBLEM(S)`);
