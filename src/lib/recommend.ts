import { oilDerivedPct } from "./materials";
import type { CatalogCard, FabricPart } from "./types";

/**
 * Pure recommendation ranking — no catalog access, no server-only, so it can
 * be tested directly against a fixture instead of 2,883 real products.
 * `catalog.ts` supplies the cards.
 */

export interface BetterFibreInput {
  category: string;
  /** null when the page didn't disclose a price we could parse. */
  price: number | null;
  fabricComposition: FabricPart[];
}

export interface BetterFibreResult {
  items: CatalogCard[];
  /** false = no natural-fibre option at this price; these cost more. */
  withinPrice: boolean;
}

/** ±35% of the item's price counts as "the same money". */
const PRICE_BAND = 0.35;

export function rankBetterFibre(
  cards: CatalogCard[],
  input: BetterFibreInput,
  limit = 4,
): BetterFibreResult {
  const myPlastic = oilDerivedPct(input.fabricComposition);
  if (myPlastic === 0) return { items: [], withinPrice: true }; // already plastic-free

  const better = cards.filter(
    (c) => c.category === input.category && oilDerivedPct(c.fabric_composition) < myPlastic,
  );
  // real, buyable listings before illustrative concept items
  const liveFirst = (a: CatalogCard, b: CatalogCard) =>
    (a.source === "live" ? 0 : 1) - (b.source === "live" ? 0 : 1);

  if (input.price != null) {
    const price = input.price;
    const inBand = better
      .filter((c) => Math.abs(c.price - price) <= price * PRICE_BAND)
      .sort(
        (a, b) =>
          liveFirst(a, b) ||
          oilDerivedPct(a.fabric_composition) - oilDerivedPct(b.fabric_composition) ||
          Math.abs(a.price - price) - Math.abs(b.price - price),
      );
    if (inBand.length > 0) return { items: inBand.slice(0, limit), withinPrice: true };
  }

  // Nothing at this price. A £20 high-street jacket has no natural-fibre
  // equal at £20 (the cheapest is £35), and an empty panel on exactly the
  // fast-fashion pages that matter most is a worse answer than an honest
  // "this is what it costs" — the caller flags the jump via withinPrice.
  const cheapest = [...better].sort(
    (a, b) =>
      liveFirst(a, b) ||
      a.price - b.price ||
      oilDerivedPct(a.fabric_composition) - oilDerivedPct(b.fabric_composition),
  );
  return { items: cheapest.slice(0, limit), withinPrice: input.price == null };
}
