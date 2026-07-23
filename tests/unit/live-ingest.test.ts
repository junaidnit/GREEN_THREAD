import { describe, expect, it } from "vitest";
import { mapCategory, parseComposition } from "@/lib/live-ingest";

describe("parseComposition — real label text from brand feeds", () => {
  it("parses a simple disclosed composition", () => {
    const parts = parseComposition("Made from 95% Organic Cotton, 5% Elastane. Machine wash cold.");
    expect(parts).toEqual([
      expect.objectContaining({ material: "organic_cotton", pct: 95 }),
      expect.objectContaining({ material: "elastane", pct: 5 }),
    ]);
  });

  it("handles TENCEL™ trademark symbols", () => {
    const parts = parseComposition("Fabric: 70% TENCEL™ Lyocell 30% organic cotton");
    expect(parts?.find((p) => p.material === "tencel_lyocell")?.pct).toBe(70);
    expect(parts?.find((p) => p.material === "organic_cotton")?.pct).toBe(30);
  });

  it("returns null when the label discloses nothing", () => {
    expect(parseComposition("A lovely soft dress in our signature print. Save 20% today!")).toBeNull();
  });

  it("returns null when percentages don't add up", () => {
    expect(parseComposition("Contains 40% cotton and some other fibres")).toBeNull();
  });

  it("rejects discount noise like 'save 30%'", () => {
    // "30% off" has no fibre word after it, so it can't create a phantom part
    expect(parseComposition("Now 30% off everything")).toBeNull();
  });

  /**
   * Real copy runs the composition straight into the feature list and uses
   * bullets as separators. The old regex demanded a clean delimiter after the
   * fibre name and capped it at 40 characters, so it silently REJECTED all of
   * these — which made Celtic & Co, a wool-and-linen brand, look like it
   * disclosed 12 of 150 items (it discloses 116) and quietly dropped good
   * products from brands already in the catalogue.
   */
  describe("compositions embedded in real product copy", () => {
    it("reads a composition that runs into the feature list", () => {
      const parts = parseComposition(
        "blends comfort with enduring quality. 100% Cotton Collared Relaxed fit Exclusive brand yarn",
      );
      expect(parts).toEqual([expect.objectContaining({ material: "conventional_cotton", pct: 100 })]);
    });

    it("handles bullet separators", () => {
      const parts = parseComposition("CS-Code: 9131 • 70% Cotton, 30% Euroflax Linen • Boat Neck • Relaxed Fit");
      expect(parts?.find((p) => p.material === "conventional_cotton")?.pct).toBe(70);
      expect(parts?.find((p) => p.material === "linen")?.pct).toBe(30);
    });

    it("does not let a later fibre bleed into an earlier percentage", () => {
      // "70% Cotton, 30% Linen" must not read Linen as the 70% part
      const parts = parseComposition("70% Cotton, 30% Linen");
      expect(parts?.find((p) => p.material === "conventional_cotton")?.pct).toBe(70);
    });

    it("still ignores sale percentages with no fibre after them", () => {
      expect(parseComposition("Save 50% off everything this weekend")).toBeNull();
      expect(parseComposition("Rated 100% by our customers")).toBeNull();
      expect(parseComposition("Only 40% of our range is on sale")).toBeNull();
    });
  });

  it("averages multi-part garments (shell + lining both 100%)", () => {
    const parts = parseComposition("Shell: 100% recycled polyester. Lining: 100% organic cotton.");
    const total = parts!.reduce((s, p) => s + p.pct, 0);
    expect(total).toBe(100);
    expect(parts!.length).toBe(2);
  });

  it("merges duplicate fibre mentions", () => {
    const parts = parseComposition("Body: 60% cotton. Sleeves: 40% cotton.");
    expect(parts).toHaveLength(1);
    expect(parts![0].pct).toBe(100);
  });

  it("classifies bamboo viscose honestly as viscose (semi-synthetic)", () => {
    const parts = parseComposition("53% Bamboo Viscose, 28% Recycled Polyester, 19% Organic Cotton");
    expect(parts?.find((p) => p.material === "viscose")?.pct).toBe(53);
    expect(parts?.find((p) => p.material === "recycled_polyester")?.pct).toBe(28);
  });
});

describe("mapCategory — Shopify product types to our taxonomy", () => {
  it("maps garments", () => {
    expect(mapCategory("Dresses", "Slip Dress - Black")).toBe("dresses");
    expect(mapCategory("", "Essential Slim Straight Jeans")).toBe("jeans");
    expect(mapCategory("Tops", "Hemp Long Sleeve Striped Top")).toBe("t-shirts");
    expect(mapCategory("Knitwear", "Wool Jumper")).toBe("knitwear");
  });

  it("maps accessories including berets and mittens", () => {
    expect(mapCategory("", "Bamboo Socks - Lichen Green")).toBe("accessories");
    expect(mapCategory("", "Pointelle Beret - Berry Pink")).toBe("accessories");
    expect(mapCategory("", "Shearling Hooded Mitten - Light Grey")).toBe("accessories");
  });

  it("treats 'short' as an adjective, not a garment", () => {
    // these were all filed as trousers because bare /short/ matched
    expect(mapCategory("", "Short Sleeve Rib Henley Top - Navy")).toBe("t-shirts");
    expect(mapCategory("", "Vita - Ribbed Cotton Scoop Neck Short Sleeve T-Shirt")).toBe("t-shirts");
    expect(mapCategory("", "Utility Short Blouson Jacket")).toBe("outerwear");
    expect(mapCategory("", "Short Sleeve Linen Shirt")).toBe("shirts");
  });

  it("still maps actual shorts to trousers", () => {
    expect(mapCategory("", "Calum Organic Cotton Shorts - Green")).toBe("trousers");
    expect(mapCategory("Shorts", "Sylvia Organic Cotton Shorts in Crepe")).toBe("trousers");
  });

  it("lets the garment type beat the fabric", () => {
    expect(mapCategory("", "Denim Jacket - Indigo")).toBe("outerwear");
    expect(mapCategory("", "Denim Skirt - Black")).toBe("skirts");
    expect(mapCategory("", "Slim Straight Jeans - Dark Indigo")).toBe("jeans");
  });
});

describe("mapCategory — unclassifiable is not 'shirts'", () => {
  // The old default returned "shirts" for anything unmatched, so a purse, a
  // necklace and a plant-hanger kit all became shirts — polluting the shirts
  // facet and passing the matcher's garment gate as t-shirt alternatives.
  it("does not guess a garment for non-garments", () => {
    expect(mapCategory("", "Eve - Purse in Black")).toBe("other");
    expect(mapCategory("", "CHAANDRA Necklace")).toBe("other");
    expect(mapCategory("", "DIY Square Knot Macrame Plant Hanger Kit")).toBe("other");
    expect(mapCategory("Gift Cards", "Gift Cards")).toBe("other");
  });

  it("still maps real garments", () => {
    expect(mapCategory("Shirt", "LOYLE Organic Cotton Shirt")).toBe("shirts");
    expect(mapCategory("", "Linen Midi Dress")).toBe("dresses");
    expect(mapCategory("", "Organic Cotton T-Shirt")).toBe("t-shirts");
  });
});
