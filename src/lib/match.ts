import { colourFamilies, colourMatch, garmentType, genderCompatible, genderFor, patternOf } from "./garment";
import { oilDerivedPct } from "./materials";
import type { FabricPart } from "./types";

/**
 * The core promise: the SAME item — same garment type, same design, same
 * colour, wearable by the same person — in a better fabric.
 *
 * Everything before this ranked on `category` alone, which is why a navy
 * men's polo was offered a pink camisole (both live in the "t-shirts"
 * bucket). Here the identity of the garment is a HARD GATE, not a scoring
 * nudge, and when nothing passes we return nothing with a reason. An empty,
 * honest panel beats a confident irrelevant one — the whole product is a
 * trust play.
 *
 * Pure: no catalog access, no I/O. Callers pass candidates in.
 */

export interface MatchItem {
  id: string;
  title: string;
  category: string;
  gender: string;
  color?: string;
  price: number;
  sizes?: string[];
  source?: string;
  fabric_composition: FabricPart[];
}

/** How close the match is — surfaced to the shopper, never hidden. */
export type MatchTier = "exact" | "same-style";

export interface Match<T extends MatchItem> {
  item: T;
  tier: MatchTier;
  sameColour: boolean;
  samePattern: boolean;
  /** Percentage points of oil-derived plastic removed vs the target. */
  plasticSaved: number;
  /** Positive = costs more than the original. */
  priceDelta: number;
  /** Visual similarity from the CLIP twin index, when available. */
  sim?: number;
}

export type NoMatchReason =
  | "already-plastic-free"
  | "no-better-fibre-in-this-style";

export interface MatchResult<T extends MatchItem> {
  matches: Match<T>[];
  reason?: NoMatchReason;
}

/** "Same money" band. Beyond this we still show, but flag the jump. */
export const PRICE_BAND = 0.25;

function sizeOverlap(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(b);
  return a.filter((s) => set.has(s)).length;
}

/**
 * Rank candidates as replacements for `target`.
 * `sims` optionally supplies visual similarity by candidate id.
 */
export function rankSameButBetter<T extends MatchItem>(
  target: MatchItem,
  candidates: T[],
  opts: { limit?: number; sims?: Map<string, number> } = {},
): MatchResult<T> {
  const { limit = 4, sims } = opts;

  const myPlastic = oilDerivedPct(target.fabric_composition);
  if (myPlastic === 0) return { matches: [], reason: "already-plastic-free" };

  const myType = garmentType(target.title, target.category);
  const myGender = genderFor(target.title, myType, target.gender);
  const myPattern = patternOf(target.title);
  const myColour = colourFamilies(target.title, target.color ?? "");

  const scored: Match<T>[] = [];
  for (const c of candidates) {
    if (c.id === target.id) continue;

    // ── hard gates ────────────────────────────────────────────────
    // 1. it must be the same kind of garment (polo ≠ tee ≠ camisole)
    const cType = garmentType(c.title, c.category);
    if (cType !== myType || cType === "other") continue;

    // 2. the same person must be able to wear it
    const cGender = genderFor(c.title, cType, c.gender);
    if (!genderCompatible(myGender, cGender)) continue;

    // 3. it must actually be a fibre upgrade — the entire point
    const cPlastic = oilDerivedPct(c.fabric_composition);
    if (cPlastic >= myPlastic) continue;

    // ── preferences ───────────────────────────────────────────────
    const samePattern = patternOf(c.title) === myPattern;
    const sameColour = colourMatch(myColour, colourFamilies(c.title, c.color ?? ""));

    scored.push({
      item: c,
      tier: samePattern && sameColour ? "exact" : "same-style",
      sameColour,
      samePattern,
      plasticSaved: myPlastic - cPlastic,
      priceDelta: c.price - target.price,
      sim: sims?.get(c.id),
    });
  }

  if (scored.length === 0) return { matches: [], reason: "no-better-fibre-in-this-style" };

  const tierRank = (m: Match<T>) => (m.tier === "exact" ? 0 : 1);
  const inBand = (m: Match<T>) => (Math.abs(m.priceDelta) <= target.price * PRICE_BAND ? 0 : 1);
  const liveRank = (m: Match<T>) => (m.item.source === "live" ? 0 : 1);

  scored.sort(
    (a, b) =>
      tierRank(a) - tierRank(b) ||
      // a same-colour match beats a same-pattern-only one
      Number(b.sameColour) - Number(a.sameColour) ||
      Number(b.samePattern) - Number(a.samePattern) ||
      inBand(a) - inBand(b) ||
      liveRank(a) - liveRank(b) ||
      (b.sim ?? 0) - (a.sim ?? 0) ||
      sizeOverlap(target.sizes, b.item.sizes) - sizeOverlap(target.sizes, a.item.sizes) ||
      b.plasticSaved - a.plasticSaved ||
      Math.abs(a.priceDelta) - Math.abs(b.priceDelta),
  );

  return { matches: scored.slice(0, limit) };
}

/**
 * "Same look" — the same garment type and design, fibre irrelevant.
 * Used for the browse-adjacent rail, where the shopper is exploring rather
 * than upgrading. Still never crosses garment type or gender.
 */
export function rankSameLook<T extends MatchItem>(
  target: MatchItem,
  candidates: T[],
  opts: { limit?: number; sims?: Map<string, number> } = {},
): T[] {
  const { limit = 8, sims } = opts;
  const myType = garmentType(target.title, target.category);
  const myGender = genderFor(target.title, myType, target.gender);
  const myPattern = patternOf(target.title);
  const myColour = colourFamilies(target.title, target.color ?? "");
  if (myType === "other") return [];

  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => {
      const cType = garmentType(c.title, c.category);
      const cGender = genderFor(c.title, cType, c.gender);
      if (cType !== myType || !genderCompatible(myGender, cGender)) return null;
      let score = 0;
      if (patternOf(c.title) === myPattern) score += 3;
      if (colourMatch(myColour, colourFamilies(c.title, c.color ?? ""))) score += 2;
      if (Math.abs(c.price - target.price) <= target.price * 0.4) score += 1;
      score += (sims?.get(c.id) ?? 0) * 2;
      return { c, score };
    })
    .filter((x): x is { c: T; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}
