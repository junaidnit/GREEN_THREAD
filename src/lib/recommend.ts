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

  if (input.price != null) {
    const price = input.price;
    const inBand = matches.filter((m) => Math.abs(m.item.price - price) <= price * PRICE_BAND);
    if (inBand.length > 0) {
      const top = inBand.slice(0, limit);
      return { items: top.map((m) => m.item), withinPrice: true, matches: top };
    }
    // Nothing at this price. A £20 high-street jacket has no natural-fibre
    // equal at £20 (the cheapest is £35), and an empty panel on exactly the
    // fast-fashion pages that matter most is a worse answer than an honest
    // "this is what it costs", the caller flags the jump via withinPrice.
    //
    // Sorting this fallback by PRICE ALONE threw away the look-alike ranking
    // entirely: an olive jacket was answered with a Batik print, a black
    // print and a pink check, purely because they were the cheapest naturals
    // in the category. Since almost every high-street item lands here, that
    // one line was most of "the recommendations look nothing like it".
    // Resemblance leads; price only breaks ties between equally-close pieces.
    const closestFirst = [...matches].sort(
      (a, b) =>
        (a.tier === "exact" ? 0 : 1) - (b.tier === "exact" ? 0 : 1) ||
        Number(b.sameColour) - Number(a.sameColour) ||
        Number(b.samePattern) - Number(a.samePattern) ||
        a.item.price - b.item.price,
    );
    const top = closestFirst.slice(0, limit);
    return { items: top.map((m) => m.item), withinPrice: false, matches: top };
  }

  const top = matches.slice(0, limit);
  return { items: top.map((m) => m.item), withinPrice: true, matches: top };
}
