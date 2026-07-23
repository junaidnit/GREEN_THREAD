import { rankSameButBetter, PRICE_BAND, type Match } from "./match";

import type { Pattern } from "./garment";
import type { CatalogCard, FabricPart } from "./types";

/**
 * Pure recommendation ranking, no catalog access, no server-only, so it can
 * be tested directly against a fixture instead of 2,883 real products.
 * `catalog.ts` supplies the cards.
 *
 * The identity of the garment (type, gender, colour, pattern) is decided in
 * match.ts; this layer only adds the "can they afford it?" story.
 */

export interface BetterFibreInput {
  /** The product name as shown on the page, the strongest signal we get. */
  title: string;
  category: string;
  /** null when the page didn't disclose a price we could parse. */
  price: number | null;
  fabricComposition: FabricPart[];
  /** Colour families read from the product IMAGE, override the title. */
  imageColourFamilies?: string[];
  /** Pattern read from the product IMAGE, overrides the title. */
  imagePattern?: Pattern;
}

export interface BetterFibreResult {
  items: CatalogCard[];
  /** false = no natural-fibre option at this price; these cost more. */
  withinPrice: boolean;
  /** Per-item match detail, aligned with `items`. */
  matches: Array<Match<CatalogCard>>;
}

export function rankBetterFibre(
  cards: CatalogCard[],
  input: BetterFibreInput,
  limit = 4,
): BetterFibreResult {
  const { matches } = rankSameButBetter(
    {
      id: "__scanned__",
      title: input.title,
      category: input.category,
      gender: "unisex", // unknown for a scanned page; the title usually says
      price: input.price ?? 0,
      fabric_composition: input.fabricComposition,
    },
    cards,
    { limit: 24, imageColourFamilies: input.imageColourFamilies, imagePattern: input.imagePattern },
  );

  if (matches.length === 0) return { items: [], withinPrice: true, matches: [] };

  const price = input.price;

  /**
   * RESEMBLANCE FIRST, PRICE SECOND — in that order, deliberately.
   *
   * This used to return ONLY items inside the ±25% price band whenever any
   * existed, which let price silently override what the thing looks like.
   * Scanning a £14.99 pink check top returned black-and-white STRIPE tees,
   * while "Lumi — Cotton Cropped Woven Top in Maroon Deco Rose Check" — the
   * actual look-alike — sat unshown at £35, outside the band. For a product
   * whose promise is "the same garment in a better fabric", a closer match
   * two tiers up in price is a better answer than a cheap piece that looks
   * nothing like it. Price still ranks equally-close pieces, so the
   * affordable one wins whenever the look is a tie.
   */
  const inBand = (m: Match<CatalogCard>) =>
    price != null && Math.abs(m.item.price - price) <= price * PRICE_BAND;

  // Resemblance outranks price, but not without limit: answering a £15 tee
  // with a £220 coat is useless however well it matches. Anything beyond 4×
  // is dropped, unless that would leave nothing to show at all.
  const affordable = price == null ? matches : matches.filter((m) => m.item.price <= price * 4);
  const pool = affordable.length > 0 ? affordable : matches;

  const ranked = [...pool].sort(
    (a, b) =>
      (a.tier === "exact" ? 0 : 1) - (b.tier === "exact" ? 0 : 1) ||
      Number(b.sameColour) - Number(a.sameColour) ||
      Number(b.samePattern) - Number(a.samePattern) ||
      Number(inBand(b)) - Number(inBand(a)) ||
      a.item.price - b.item.price,
  );

  const top = ranked.slice(0, limit);
  // the heading tells the truth about the BEST pick: if the closest thing we
  // have costs meaningfully more, say so rather than implying a like-for-like
  return {
    items: top.map((m) => m.item),
    withinPrice: price == null || inBand(top[0]),
    matches: top,
  };
}
