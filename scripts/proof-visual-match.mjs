// PROOF: does CLIP image matching actually beat title-word matching for the
// extension, given this catalogue? Embeds a real product image (the Uniqlo
// olive jacket the user has been testing) and ranks natural-fibre live items
// by visual similarity. If the top hits are sensible olive/utility jackets,
// deploying visual matching is worth it. If they're random, the catalogue
// ceiling dominates and CLIP won't save it.
import { readFileSync } from "node:fs";

const IMAGE = process.argv[2] || "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/459592/item/goods_56_459592_3x4.jpg";
const CATEGORY = process.argv[3] || "outerwear";

const CACHE = "data/cache/embeddings-Xenova_clip_vit_large_patch14.json";
const MODEL = "Xenova/clip-vit-large-patch14";

const cache = JSON.parse(readFileSync(CACHE, "utf8"));
const live = JSON.parse(readFileSync("data/products_live.json", "utf8")).products;
const byId = new Map(live.map((p) => [p.id, p]));

const { AutoProcessor, CLIPVisionModelWithProjection, RawImage } = await import("@xenova/transformers");
console.log("loading", MODEL, "…");
const processor = await AutoProcessor.from_pretrained(MODEL);
const vision = await CLIPVisionModelWithProjection.from_pretrained(MODEL, { quantized: true });

const image = await RawImage.read(IMAGE);
const inputs = await processor(image);
const { image_embeds } = await vision(inputs);
let q = Array.from(image_embeds.data);
const qn = Math.sqrt(q.reduce((s, x) => s + x * x, 0));
q = q.map((x) => x / qn);

const dot = (a, b) => { let s = 0; for (let k = 0; k < a.length; k++) s += a[k] * b[k]; return s; };

// rank ALL live items, and separately the same-category ones
const scored = [];
for (const [key, vec] of Object.entries(cache)) {
  const id = key.split("|")[0];
  const p = byId.get(id);
  if (!p) continue;
  scored.push({ id, title: p.title, category: p.category, price: p.price, sim: dot(q, vec) });
}
scored.sort((a, b) => b.sim - a.sim);

console.log(`\n=== TOP 8 visually-nearest across ALL categories ===`);
scored.slice(0, 8).forEach((s) => console.log(`  ${s.sim.toFixed(3)}  [${s.category}] ${s.title} £${s.price}`));

console.log(`\n=== TOP 8 within category "${CATEGORY}" (what the extension would show) ===`);
scored.filter((s) => s.category === CATEGORY).slice(0, 8).forEach((s) => console.log(`  ${s.sim.toFixed(3)}  ${s.title} £${s.price}`));
