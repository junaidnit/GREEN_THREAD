/**
 * TWIN-FINDER PIPELINE — stage 1: visual embeddings.
 *
 * Embeds every product photo with CLIP (runs locally via ONNX — no API key,
 * no per-call cost) and precomputes each product's nearest visual neighbours.
 * The app then answers "is there a similar shirt?" from a lookup, instantly.
 *
 *   npx tsx scripts/embed-catalog.ts             # full catalog (~20 min first run)
 *   npx tsx scripts/embed-catalog.ts --limit 8   # spike / smoke test
 *
 * Outputs:
 *   data/cache/embeddings.json  (gitignored vector cache — incremental re-runs)
 *   data/twins.json             (committed: id → top visual neighbours)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SeedProduct } from "../src/lib/types";

const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? Number(process.argv[i + 1]) : Infinity;
})();

// keep a wide neighbour list so the runtime garment-type gate still has plenty
// of SAME-garment candidates to rank by visual similarity ("looks like this,
// in the right category" — Google-image-search style within the type)
const NEIGHBOURS = 48;
const OUT_PATH = resolve(process.cwd(), "data/twins.json");

/**
 * Vision models tried in order — FashionCLIP first (trained specifically on
 * fashion product imagery, so garment-vs-garment similarity is far sharper
 * than a generic CLIP), falling back to larger/base CLIP if it can't load.
 * The cache is keyed per model so switching never mixes incompatible vectors.
 */
const MODELS = [
  "Xenova/fashion-clip",
  "Xenova/clip-vit-large-patch14",
  "Xenova/clip-vit-base-patch32",
];
const cachePathFor = (model: string) =>
  resolve(process.cwd(), `data/cache/embeddings-${model.replace(/[^a-z0-9]/gi, "_")}.json`);

function loadProducts(): SeedProduct[] {
  const read = (f: string): SeedProduct[] => {
    const p = resolve(process.cwd(), f);
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).products : [];
  };
  // real products only — embeds the actual brand photos, so visual similarity
  // is meaningful (the old concept items had mismatched stock photos)
  return read("data/products_live.json").filter((p) => p.source === "live");
}

/** Small thumbnail URL — CLIP sees 224px anyway; keeps downloads tiny. */
function thumb(url: string): string {
  if (url.includes("images.unsplash.com")) return `${url.split("?")[0]}?w=224&q=70&fit=crop`;
  if (url.includes("cdn.shopify.com")) return `${url.split("?")[0]}?width=224`;
  return url;
}

async function main() {
  const products = loadProducts().slice(0, LIMIT);
  console.log(`▶ ${products.length} products to embed`);

  mkdirSync(resolve(process.cwd(), "data/cache"), { recursive: true });

  const { AutoProcessor, CLIPVisionModelWithProjection, RawImage } = await import(
    "@xenova/transformers"
  );

  // load the best model that's actually available
  let model = "";
  let processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null = null;
  let vision: Awaited<ReturnType<typeof CLIPVisionModelWithProjection.from_pretrained>> | null = null;
  for (const candidate of MODELS) {
    try {
      console.log(`  loading ${candidate} (first run downloads once)…`);
      processor = await AutoProcessor.from_pretrained(candidate);
      vision = await CLIPVisionModelWithProjection.from_pretrained(candidate, { quantized: true });
      model = candidate;
      break;
    } catch (e) {
      console.log(`   ✗ ${candidate} unavailable: ${e instanceof Error ? e.message.slice(0, 90) : e}`);
    }
  }
  if (!processor || !vision) throw new Error("no vision model could be loaded");
  console.log(`  ✓ using ${model}`);

  const CACHE_PATH = cachePathFor(model);
  const cache: Record<string, number[]> = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, "utf8"))
    : {};

  let done = 0;
  let failed = 0;
  for (const p of products) {
    const key = `${p.id}|${p.image_url}`;
    if (cache[key]) { done++; continue; }
    try {
      const image = await RawImage.read(thumb(p.image_url));
      const inputs = await processor(image);
      const { image_embeds } = await vision(inputs);
      const vec = Array.from(image_embeds.data as Float32Array);
      // L2-normalise so cosine similarity is a plain dot product later
      const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
      cache[key] = vec.map((x) => Number((x / norm).toFixed(5)));
      done++;
    } catch (e) {
      failed++;
      console.log(`   ✗ ${p.id}: ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    }
    if (done % 100 === 0) {
      writeFileSync(CACHE_PATH, JSON.stringify(cache));
      console.log(`   …${done}/${products.length} embedded (${failed} failed)`);
    }
  }
  writeFileSync(CACHE_PATH, JSON.stringify(cache));
  console.log(`✓ embeddings: ${done} ok, ${failed} failed (${model}) → ${CACHE_PATH}`);

  // stage 2: nearest neighbours (brute force is fine at this scale)
  console.log("▶ computing visual twins…");
  const ids: string[] = [];
  const vecs: number[][] = [];
  for (const p of products) {
    const v = cache[`${p.id}|${p.image_url}`];
    if (v) { ids.push(p.id); vecs.push(v); }
  }
  const liveIdx = new Set(
    products.filter((p) => p.source === "live").map((p) => ids.indexOf(p.id)).filter((i) => i >= 0),
  );

  const dot = (a: number[], b: number[]) => {
    let s = 0;
    for (let k = 0; k < a.length; k++) s += a[k] * b[k];
    return s;
  };

  const twins: Record<string, Array<{ id: string; sim: number }>> = {};
  // concept → nearest LIVE items, computed against the live pool only:
  // live photos (e-commerce flat-lays) rarely crack a concept item's global
  // top-N because CLIP clusters photo *style* — so we ask the question directly
  const liveTwins: Record<string, Array<{ id: string; sim: number }>> = {};
  for (let i = 0; i < ids.length; i++) {
    const scored: Array<{ id: string; sim: number; live: boolean }> = [];
    for (let j = 0; j < ids.length; j++) {
      if (i === j) continue;
      scored.push({ id: ids[j], sim: dot(vecs[i], vecs[j]), live: liveIdx.has(j) });
    }
    scored.sort((x, y) => y.sim - x.sim);
    twins[ids[i]] = scored.slice(0, NEIGHBOURS).map((s) => ({ id: s.id, sim: Number(s.sim.toFixed(3)) }));
    if (!liveIdx.has(i)) {
      liveTwins[ids[i]] = scored
        .filter((s) => s.live)
        .slice(0, 6)
        .map((s) => ({ id: s.id, sim: Number(s.sim.toFixed(3)) }));
    }
    if ((i + 1) % 500 === 0) console.log(`   …${i + 1}/${ids.length}`);
  }

  writeFileSync(OUT_PATH, JSON.stringify({ computed_at: new Date().toISOString(), twins, liveTwins }));
  console.log(`✓ TWINS for ${ids.length} products (+ live lookalikes for ${Object.keys(liveTwins).length}) → data/twins.json`);
  if (ids.length > 0) {
    const first = ids[0];
    console.log(`  sample: ${first} ↔ ${twins[first].slice(0, 3).map((t) => `${t.id} (${t.sim})`).join(", ")}`);
  }
}

main();
