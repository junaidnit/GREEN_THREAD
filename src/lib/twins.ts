import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { dataPath } from "./data-root";
import type { Product } from "./types";
import { rankSameButBetter, rankSameLook, type MatchResult } from "./match";

/**
 * Visual-similarity lookups over the precomputed CLIP twin index
 * (data/twins.json, built offline by scripts/embed-catalog.ts). No model runs
 * at request time.
 *
 * Similarity is a RANKING signal only, never a gate: CLIP scores cluster
 * around ~0.73 for almost any two catalogue photos because it keys on
 * studio style as much as on the garment. What the item actually IS, * garment type, gender, colour, pattern, is decided in match.ts.
 */

interface TwinEntry {
  id: string;
  sim: number;
}

interface TwinIndex {
  twins: Record<string, TwinEntry[]>;
  /** concept id → nearest LIVE items (separate pool; see embed-catalog.ts) */
  liveTwins?: Record<string, TwinEntry[]>;
}

let _index: TwinIndex | null | undefined;

function loadIndex(): TwinIndex | null {
  if (_index !== undefined) return _index;
  const p = dataPath("data", "twins.json");
  _index = existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as TwinIndex) : null;
  return _index ?? null;
}

/** Visual similarity to this product, by candidate id. */
export function simsFor(id: string): Map<string, number> {
  const idx = loadIndex();
  const sims = new Map<string, number>();
  for (const e of idx?.twins?.[id] ?? []) sims.set(e.id, e.sim);
  for (const e of idx?.liveTwins?.[id] ?? []) sims.set(e.id, e.sim);
  return sims;
}

/** Same garment, same design, the browse rail. Fibre-agnostic. */
export function getSameLook(product: Product, all: Product[], limit = 8): Product[] {
  return rankSameLook(product, all, { limit, sims: simsFor(product.id) });
}

/** THE core promise: the same item, in a better fabric. */
export function getSameButBetter(
  product: Product,
  all: Product[],
  limit = 4,
): MatchResult<Product> {
  return rankSameButBetter(product, all, { limit, sims: simsFor(product.id) });
}

/**
 * For concept items: the closest REAL listing of the same garment, * "here's the version of this you can actually buy today".
 */
export function getLiveLookalike(
  product: Product,
  all: Product[],
): { product: Product; sim: number } | null {
  if (product.source === "live") return null;
  const sims = simsFor(product.id);
  const live = all.filter((p) => p.source === "live");
  const hit = rankSameLook(product, live, { limit: 1, sims })[0];
  return hit ? { product: hit, sim: sims.get(hit.id) ?? 0 } : null;
}
