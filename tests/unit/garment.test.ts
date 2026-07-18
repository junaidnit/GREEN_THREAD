import { describe, expect, it } from "vitest";
import {
  colourFamilies,
  colourFamily,
  colourMatch,
  garmentType,
  genderFor,
  patternOf,
} from "@/lib/garment";

describe("garmentType — a polo is not a tee", () => {
  it("separates the tops that 'category' lumps together", () => {
    expect(garmentType("Classic Pique Polo")).toBe("polo");
    expect(garmentType("Everyday Tee — Ecru")).toBe("tee");
    expect(garmentType("FREIDA - Rayon Pink Camisole")).toBe("tank");
    expect(garmentType("Sculpt Knit Tank")).toBe("tank");
    expect(garmentType("Short Sleeve Rib Henley Top")).toBe("henley");
    // all four arrive from the feed as category "t-shirts"
    for (const t of ["Classic Pique Polo", "Everyday Tee", "Rayon Camisole", "Rib Henley Top"]) {
      expect(garmentType(t, "t-shirts")).not.toBe("other");
    }
  });

  it("reads the title over the category — the denim-shirt bug", () => {
    // the feed files this under category "jeans" because it says "denim"
    expect(garmentType("KARDA Organic Cotton Denim Shirt - Dark Denim", "jeans")).toBe("shirt");
    expect(garmentType("Denim Jacket - Indigo", "jeans")).toBe("jacket");
    expect(garmentType("Slim Straight Jeans", "jeans")).toBe("jeans");
  });

  it("prefers the most specific garment noun", () => {
    expect(garmentType("Organic Cotton Polo Shirt")).toBe("polo"); // not "shirt"
    expect(garmentType("Hooded Sweatshirt")).toBe("hoodie"); // not "sweatshirt"
    expect(garmentType("Shirt Dress in Navy")).toBe("dress"); // not "shirt"
  });

  it("understands UK vest and gilet", () => {
    expect(garmentType("Tully - Cotton Strappy Vest in Black")).toBe("tank");
    expect(garmentType("Quilted Gilet - Navy")).toBe("gilet");
  });

  it("classifies base layers, belts and homeware (was 'other')", () => {
    expect(garmentType("Alpenglow Base Layer", "activewear")).toBe("baselayer");
    expect(garmentType("Relaxed Merino wool Base Layer — Charcoal")).toBe("baselayer");
    expect(garmentType("Linen Belt — Black", "accessories")).toBe("belt");
    expect(garmentType("Organic cotton Belt — Forest")).toBe("belt");
    expect(garmentType("Waxed Work Apron")).toBe("homeware");
    expect(garmentType("Heirloom Baby Blanket")).toBe("homeware");
  });

  it("keeps belt/homeware words from hijacking real garments", () => {
    expect(garmentType("Belted Wool Coat - Camel")).toBe("coat"); // "belted" ≠ belt
    expect(garmentType("Terry Towelling Polo")).toBe("polo"); // "towelling" ≠ towel
    expect(garmentType("Throw-on Linen Dress")).toBe("dress");
  });

  it("falls back to the category when the title is opaque", () => {
    expect(garmentType("Byeol - Delano", "dresses")).toBe("dress");
    expect(garmentType("Mystery Item")).toBe("other");
  });
});

describe("colour — the /ink/ matching P-INK bug", () => {
  it("does not file pink garments as black", () => {
    expect(colourFamily("Rayon Pink Camisole")).toBe("Pink & Purple");
    expect(colourFamilies("Rayon Pink Camisole").has("Black")).toBe(false);
  });

  it("still recognises real ink/black names", () => {
    expect(colourFamily("Tee in Ink")).toBe("Black");
    expect(colourFamily("Charcoal Jumper")).toBe("Black");
  });

  it("collects every colour in a two-tone name", () => {
    const c = colourFamilies("Dress in Navy & White Check");
    expect(c.has("Blue")).toBe(true);
    expect(c.has("White & Cream")).toBe(true);
  });

  it("matches two-tone garments by overlap, not by label", () => {
    const navyWhite = colourFamilies("Dress in Navy & White Check");
    const whiteBlue = colourFamilies("Dress In White & Blue Check");
    expect(colourMatch(navyWhite, whiteBlue)).toBe(true);
    expect(colourMatch(navyWhite, colourFamilies("Dress in Coral"))).toBe(false);
  });

  it("reports the dominant (first-named) colour for display", () => {
    expect(colourFamily("Dress in Navy & White Check")).toBe("Blue");
  });

  it("returns nothing rather than guessing", () => {
    expect(colourFamily("Organic Cotton Dress")).toBeNull();
    expect(colourMatch(colourFamilies("Plain Dress"), colourFamilies("Navy Dress"))).toBe(false);
  });

  it("never calls a striped garment blue just for being striped", () => {
    // the old rule mapped /stripe/ → "Blue" outright
    expect(colourFamilies("Red & White Stripe Top").has("Blue")).toBe(false);
  });
});

describe("patternOf", () => {
  it("reads the design out of the title", () => {
    expect(patternOf("Ada Organic Cotton Gingham Dress")).toBe("check");
    expect(patternOf("Navy & White Check Shirt")).toBe("check");
    expect(patternOf("Breton Stripe Tee")).toBe("stripe");
    expect(patternOf("Ditsy Floral Dress")).toBe("floral");
    expect(patternOf("Leopard Print Skirt")).toBe("print");
    expect(patternOf("Organic Cotton Tee")).toBe("plain");
  });
});

describe("genderFor — feeds mislabel constantly", () => {
  it("lets the garment type override a wrong feed tag", () => {
    // these arrived from the live feed tagged "men"
    expect(genderFor("DUSK - Organic Cotton Dress - Orange", "dress", "men")).toBe("women");
    expect(genderFor("SANTO Organic Cotton Skirt - Black", "skirt", "men")).toBe("women");
    expect(genderFor("FREIDA - Rayon Pink Camisole", "tank", "men")).toBe("women");
  });

  it("respects explicit wording first", () => {
    expect(genderFor("Men's Organic Tee", "tee", "women")).toBe("men");
    expect(genderFor("Women's Hemp Trousers", "trousers", "men")).toBe("women");
    expect(genderFor("Unisex Tee", "tee", "men")).toBe("unisex");
  });

  it("keeps the feed's gender for neutral garments", () => {
    expect(genderFor("Organic Cotton Tee", "tee", "men")).toBe("men");
    expect(genderFor("Organic Cotton Tee", "tee", undefined)).toBe("unisex");
  });
});
