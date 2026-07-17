import { describe, expect, it } from "vitest";
import { rankSameButBetter, rankSameLook, type MatchItem } from "@/lib/match";
import type { FabricPart } from "@/lib/types";

/**
 * The product's core promise: the SAME item — same garment, same design,
 * same wearer — in a better fabric. These tests encode the real failure the
 * user hit: a navy men's polo was offered a pink camisole.
 */
const POLY: FabricPart[] = [{ material: "polyester", label: "Polyester", pct: 100 }];
const HALF: FabricPart[] = [
  { material: "polyester", label: "Polyester", pct: 50 },
  { material: "conventional_cotton", label: "Cotton", pct: 50 },
];
const COTTON: FabricPart[] = [{ material: "organic_cotton", label: "Organic Cotton", pct: 100 }];

const item = (over: Partial<MatchItem> & { id: string; title: string }): MatchItem => ({
  category: "t-shirts",
  gender: "unisex",
  price: 30,
  fabric_composition: COTTON,
  ...over,
});

const NAVY_POLY_POLO = item({
  id: "target",
  title: "Classic Pique Polo — Navy",
  gender: "men",
  price: 15,
  fabric_composition: HALF,
});

describe("rankSameButBetter — hard gates", () => {
  it("never answers a polo with a camisole (the reported bug)", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "cami", title: "FREIDA - Rayon Pink Camisole", gender: "men" }),
      item({ id: "tee", title: "Everyday Tee — Ecru" }),
      item({ id: "dress", title: "Organic Cotton Dress - Orange", category: "dresses" }),
    ]);
    expect(matches).toEqual([]);
  });

  it("finds the same garment in a better fabric", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "polo-navy", title: "FRANK - Organic Cotton Knit Polo - Navy", gender: "men", price: 40 }),
      item({ id: "tee", title: "Organic Cotton Tee - Navy" }),
    ]);
    expect(matches.map((m) => m.item.id)).toEqual(["polo-navy"]);
    expect(matches[0].tier).toBe("exact"); // same colour + same (plain) pattern
    expect(matches[0].plasticSaved).toBe(50);
    expect(matches[0].priceDelta).toBe(25);
  });

  it("never crosses gender", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "womens", title: "Women's Organic Polo - Navy", gender: "women", price: 20 }),
    ]);
    expect(matches).toEqual([]);
  });

  it("never recommends equal or worse fibre", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "worse", title: "Polyester Polo - Navy", gender: "men", fabric_composition: POLY }),
      item({ id: "same", title: "Blend Polo - Navy", gender: "men", fabric_composition: HALF }),
    ]);
    expect(matches).toEqual([]);
  });

  it("says nothing — with a reason — rather than showing junk", () => {
    const { matches, reason } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "dress", title: "Linen Dress", category: "dresses" }),
    ]);
    expect(matches).toEqual([]);
    expect(reason).toBe("no-better-fibre-in-this-style");
  });

  it("has nothing to offer an already plastic-free garment", () => {
    const { matches, reason } = rankSameButBetter(
      item({ id: "t", title: "Linen Polo", fabric_composition: COTTON }),
      [item({ id: "other", title: "Hemp Polo" })],
    );
    expect(matches).toEqual([]);
    expect(reason).toBe("already-plastic-free");
  });
});

describe("rankSameButBetter — ranking", () => {
  it("puts the same colour and design first", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "green", title: "Organic Polo - Green", gender: "men" }),
      item({ id: "navy", title: "Organic Polo - Navy", gender: "men" }),
    ]);
    expect(matches[0].item.id).toBe("navy");
    expect(matches[0].tier).toBe("exact");
    expect(matches[1].tier).toBe("same-style");
  });

  it("keeps a checked shirt checked", () => {
    const target = item({
      id: "t",
      title: "Slim Check Shirt — Blue & White",
      category: "shirts",
      gender: "men",
      fabric_composition: HALF,
    });
    const { matches } = rankSameButBetter(target, [
      item({ id: "plain", title: "Organic Cotton Shirt - Blue", category: "shirts", gender: "men" }),
      item({ id: "check", title: "Organic Cotton Gingham Shirt - Blue & White", category: "shirts", gender: "men" }),
    ]);
    expect(matches[0].item.id).toBe("check");
    expect(matches[0].samePattern).toBe(true);
  });

  it("prefers a real listing over a concept item, all else equal", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "concept", title: "Organic Polo - Navy", gender: "men", price: 40 }),
      item({ id: "live", title: "Organic Polo - Navy", gender: "men", price: 40, source: "live" }),
    ]);
    expect(matches[0].item.id).toBe("live");
  });

  it("prefers the same money when the design ties", () => {
    const { matches } = rankSameButBetter(NAVY_POLY_POLO, [
      item({ id: "dear", title: "Organic Polo - Navy", gender: "men", price: 90 }),
      item({ id: "near", title: "Organic Polo - Navy", gender: "men", price: 17 }),
    ]);
    expect(matches[0].item.id).toBe("near");
  });
});

describe("rankSameLook", () => {
  it("stays within the garment type and gender", () => {
    const out = rankSameLook(NAVY_POLY_POLO, [
      item({ id: "polo", title: "Organic Polo - Green", gender: "men" }),
      item({ id: "tee", title: "Organic Tee - Navy", gender: "men" }),
      item({ id: "womens-polo", title: "Women's Polo - Navy", gender: "women" }),
    ]);
    expect(out.map((p) => p.id)).toEqual(["polo"]);
  });

  it("ranks the same colour first", () => {
    const out = rankSameLook(NAVY_POLY_POLO, [
      item({ id: "green", title: "Organic Polo - Green", gender: "men" }),
      item({ id: "navy", title: "Organic Polo - Navy", gender: "men" }),
    ]);
    expect(out[0].id).toBe("navy");
  });
});
