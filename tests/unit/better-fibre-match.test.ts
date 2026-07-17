import { describe, expect, it } from "vitest";
import { rankBetterFibre } from "@/lib/recommend";
import type { CatalogCard } from "@/lib/types";

/**
 * rankBetterFibre powers the browser extension's "buy this instead" panel:
 * given a garment on someone else's site, what should we offer instead?
 */
const card = (over: Partial<CatalogCard> & { id: string; price: number }): CatalogCard => ({
  brand: { slug: "b", name: "Brand" },
  title: over.id,
  category: "outerwear",
  gender: "unisex",
  currency: "GBP",
  retailer: "Brand",
  image_url: "",
  color: "",
  color_family: "",
  sizes: [],
  fit: "Regular",
  fabric_composition: [{ material: "organic_cotton", label: "Organic Cotton", pct: 100 }],
  sustainability: { score: 70, grade: "B", certifications: [], greenwash_flags: [] },
  ...over,
});

const CARDS: CatalogCard[] = [
  card({ id: "cheap-natural-jacket", price: 35, source: "live" }),
  card({ id: "pricey-natural-jacket", price: 120, source: "live" }),
  card({ id: "concept-natural-jacket", price: 36 }), // no source → concept item
  card({
    id: "plastic-jacket",
    price: 30,
    source: "live",
    fabric_composition: [{ material: "polyester", label: "Polyester", pct: 100 }],
  }),
  card({ id: "natural-tee", price: 20, source: "live", category: "t-shirts" }),
];

/** A £20 high-street jacket, 60% polyester — the fast-fashion case. */
const HIGH_STREET_JACKET = {
  title: "Padded Jacket",
  category: "outerwear",
  price: 20,
  fabricComposition: [
    { material: "polyester" as const, label: "Polyester", pct: 60 },
    { material: "conventional_cotton" as const, label: "Cotton", pct: 40 },
  ],
};

describe("rankBetterFibre", () => {
  it("prefers a natural option inside the price band", () => {
    const { items, withinPrice } = rankBetterFibre(CARDS, { ...HIGH_STREET_JACKET, price: 40 });
    expect(withinPrice).toBe(true);
    expect(items.map((i) => i.id)).toContain("cheap-natural-jacket"); // £35, within ±35% of £40
    expect(items.map((i) => i.id)).not.toContain("pricey-natural-jacket");
  });

  it("still recommends when nothing matches the price, flagging the jump", () => {
    // cheapest natural jacket is £35 — outside ±35% of £20. Showing nothing
    // here would empty the panel on exactly the pages that matter most.
    const { items, withinPrice } = rankBetterFibre(CARDS, HIGH_STREET_JACKET);
    expect(withinPrice).toBe(false);
    expect(items[0].id).toBe("cheap-natural-jacket"); // cheapest way in, not the £120 one
  });

  it("never recommends something with equal or more plastic", () => {
    const { items } = rankBetterFibre(CARDS, HIGH_STREET_JACKET);
    expect(items.map((i) => i.id)).not.toContain("plastic-jacket");
  });

  it("stays inside the garment type — a jacket is never answered with a tee", () => {
    const { items } = rankBetterFibre(CARDS, HIGH_STREET_JACKET);
    expect(items.map((i) => i.id)).not.toContain("natural-tee");
  });

  it("recommends nothing for an already plastic-free garment", () => {
    const { items } = rankBetterFibre(CARDS, {
      title: "Linen Jacket",
      category: "outerwear",
      price: 40,
      fabricComposition: [{ material: "linen", label: "Linen", pct: 100 }],
    });
    expect(items).toEqual([]);
  });

  it("puts real live listings ahead of concept items at a similar price", () => {
    const { items } = rankBetterFibre(CARDS, { ...HIGH_STREET_JACKET, price: 36 });
    expect(items[0].source).toBe("live");
    expect(items[0].id).toBe("cheap-natural-jacket");
  });

  it("treats a missing price as 'no price constraint', not a failure", () => {
    const { items, withinPrice } = rankBetterFibre(CARDS, { ...HIGH_STREET_JACKET, price: null });
    expect(withinPrice).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});
