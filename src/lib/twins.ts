import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { dataPath } from "./data-root";
import type { Product } from "./types";
import { oilDerivedPct } from "./materials";

/**
 * Twin-finder runtime: answers "is there a similar shirt?" from the
 * precomputed visual-neighbour index (data/twins.json, built offline by
 * scripts/embed-catalog.ts with CLIP). No model runs at request time.
 *
 * Category is a hard constraint — a shirt's lookalike must be a shirt;
 * visual similarity ranks candidates *within* the category (CLIP alone
 * over-weights photo style/background).
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

function genderCompatible(a: Product, b: Product): boolean {
  return a.gender === "unisex" || b.gender === "unisex" || a.gender === b.gender;
}

function resolveEntries(
  product: Product,
  entries: TwinEntry[] | undefined,
  all: Product[],
): Array<{ p: Product; sim: number }> {
  if (!entries) return [];
  const byId = new Map(all.map((p) => [p.id, p]));
  const seen = new Set<string>([product.image_url]); // concept items share photo pools —
  const out: Array<{ p: Product; sim: number }> = []; // identical photos aren't "similar items"
  for (const e of entries) {
    const p = byId.get(e.id);
    if (!p || !genderCompatible(product, p) || seen.has(p.image_url)) continue;
    seen.add(p.image_url);
    out.push({ p, sim: e.sim });
  }
  return out;
}

function resolveTwins(product: Product, all: Product[]): Array<{ p: Product; sim: number }> {
  return resolveEntries(product, loadIndex()?.twins?.[product.id], all);
}

/** Visually closest items in the same category — the "similar shirt" answer. */
export function getSameLook(product: Product, all: Product[], limit = 8): Product[] {
  const twins = resolveTwins(product, all);
  const sameCategory = twins.filter((x) => x.p.category === product.category);
  const pool = sameCategory.length >= 4 ? sameCategory : twins;
  return pool.slice(0, limit).map((x) => x.p);
}

/** Lookalikes that beat this item on plastic at a similar price. */
export function getTwinBetterFibre(product: Product, all: Product[], limit = 4): Product[] {
  const myPlastic = oilDerivedPct(product.fabric_composition);
  if (myPlastic === 0) return [];
  return resolveTwins(product, all)
    .filter(
      (x) =>
        x.p.category === product.category &&
        oilDerivedPct(x.p.fabric_composition) < myPlastic &&
        Math.abs(x.p.price - product.price) <= product.price * 0.25,
    )
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * For concept items: the closest REAL listing that looks like it —
 * "here's the version of this you can actually buy today".
 */
export function getLiveLookalike(
  product: Product,
  all: Product[],
): { product: Product; sim: number } | null {
  if (product.source === "live") return null;
  const candidates = resolveEntries(product, loadIndex()?.liveTwins?.[product.id], all);
  const hit = candidates.find((x) => x.p.category === product.category && x.sim >= 0.6);
  return hit ? { product: hit.p, sim: hit.sim } : null;
}
