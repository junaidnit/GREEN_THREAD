import { describe, expect, it } from "vitest";
import {
  applyFilters,
  buildIndex,
  EMPTY_FILTERS,
  facetCounts,
  filtersToParams,
  paramsToFilters,
} from "@/lib/search";
import type { Product, Sustainability } from "@/lib/types";

function sus(score: number, certs: string[] = []): Sustainability {
  return {
    score,
    grade: score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "E",
    factors: [],
    explanation: "",
    greenwash_flags: [],
    certifications: certs,
    practices: {
      natural_dye: false, undyed: false, deadstock: false, pfc_free: false,
      repair_program: false, take_back: false, zero_waste: false, made_to_order: false,
    },
  };
}

const zara = {
  slug: "zara", name: "Zara", website: "https://z.example.com",
  ethics_summary: "", certifications: [], ethics_modifier: 0,
};
const seasalt = {
  slug: "seasalt", name: "Seasalt Cornwall", website: "https://s.example.com",
  ethics_summary: "", certifications: [], ethics_modifier: 0,
};

const PRODUCTS: Product[] = [
  {
    id: "linen-shirt", brand: seasalt, title: "Breezy Linen Shirt", description: "cool summer shirt",
    category: "shirts", gender: "men", price: 35, currency: "GBP", retailer: "ASOS",
    buy_url: "#", image_url: "#", color: "white", color_family: "White & Cream",
    sizes: ["S", "M", "L"],
    fabric_composition: [{ material: "linen", label: "Linen", pct: 100 }],
    sustainability: sus(85, ["European Flax", "OEKO-TEX Standard 100"]),
  },
  {
    id: "hemp-tee", brand: seasalt, title: "Hemp Tee", description: "rugged tee",
    category: "t-shirts", gender: "unisex", price: 18, currency: "GBP", retailer: "ASOS",
    buy_url: "#", image_url: "#", color: "natural", color_family: "White & Cream",
    sizes: ["XS", "S", "M", "L", "XL"],
    fabric_composition: [
      { material: "hemp", label: "Hemp", pct: 55 },
      { material: "organic_cotton", label: "Organic cotton", pct: 45 },
    ],
    sustainability: sus(88, ["USDA Organic"]),
  },
  {
    id: "poly-jogger", brand: zara, title: "Comfy Jogger", description: "cosy fleece jogger",
    category: "trousers", gender: "women", price: 16, currency: "GBP", retailer: "Zalando",
    buy_url: "#", image_url: "#", color: "grey", color_family: "Grey",
    sizes: ["S", "M"],
    fabric_composition: [
      { material: "bci_cotton", label: "BCI cotton", pct: 65 },
      { material: "polyester", label: "Polyester", pct: 35 },
    ],
    sustainability: sus(40, ["BCI"]),
  },
  {
    id: "trace-elastane", brand: zara, title: "Stretch Blouse", description: "blouse with trace stretch",
    category: "shirts", gender: "women", price: 20, currency: "GBP", retailer: "John Lewis",
    buy_url: "#", image_url: "#", color: "black", color_family: "Black",
    sizes: ["XS", "S"],
    fabric_composition: [
      { material: "tencel_lyocell", label: "TENCEL", pct: 97 },
      { material: "elastane", label: "Elastane", pct: 3 },
    ],
    sustainability: sus(70, []),
  },
];

const index = buildIndex(PRODUCTS);

describe("text search", () => {
  it("finds products by fabric word", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, q: "linen" }, index);
    expect(res.map((p) => p.id)).toContain("linen-shirt");
    expect(res.map((p) => p.id)).not.toContain("poly-jogger");
  });

  it("tolerates typos", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, q: "linnen shrit" }, index);
    expect(res.map((p) => p.id)).toContain("linen-shirt");
  });

  it('"top" finds shirts, tees and blouses via category synonyms', () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, q: "top" }, index);
    const ids = res.map((p) => p.id);
    expect(ids).toContain("linen-shirt");
    expect(ids).toContain("hemp-tee");
    expect(ids).toContain("trace-elastane");
    expect(ids).not.toContain("poly-jogger");
  });
});

describe("facet filters", () => {
  it("filters by fabric", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, fabrics: ["hemp"] }, index);
    expect(res.map((p) => p.id)).toEqual(["hemp-tee"]);
  });

  it("ignores trace fibres under 5%", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, fabrics: ["elastane"] }, index);
    expect(res).toHaveLength(0);
  });

  it("filters by brand (the Zara flow)", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, brands: ["zara"] }, index);
    expect(res.map((p) => p.id).sort()).toEqual(["poly-jogger", "trace-elastane"]);
  });

  it("brand + fabric combine (Zara, then pure TENCEL)", () => {
    const res = applyFilters(
      PRODUCTS,
      { ...EMPTY_FILTERS, brands: ["zara"], fabrics: ["tencel_lyocell"] },
      index,
    );
    expect(res.map((p) => p.id)).toEqual(["trace-elastane"]);
  });

  it("filters by size (ANY selected size available)", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, sizes: ["XL"] }, index);
    expect(res.map((p) => p.id)).toEqual(["hemp-tee"]);
  });

  it("filters by colour family", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, colors: ["Black"] }, index);
    expect(res.map((p) => p.id)).toEqual(["trace-elastane"]);
  });

  it("requires ALL selected certifications", () => {
    const res = applyFilters(
      PRODUCTS,
      { ...EMPTY_FILTERS, certs: ["European Flax", "OEKO-TEX Standard 100"] },
      index,
    );
    expect(res.map((p) => p.id)).toEqual(["linen-shirt"]);
  });

  it("gender filter includes unisex", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, gender: "men" }, index);
    expect(res.map((p) => p.id).sort()).toEqual(["hemp-tee", "linen-shirt"]);
  });

  it("filters by max price (£) and min score", () => {
    const res = applyFilters(
      PRODUCTS,
      { ...EMPTY_FILTERS, maxPrice: 20, minScore: 65 },
      index,
    );
    expect(res.map((p) => p.id).sort()).toEqual(["hemp-tee", "trace-elastane"]);
  });

  it("sorts by score by default (no query)", () => {
    const res = applyFilters(PRODUCTS, EMPTY_FILTERS, index);
    expect(res[0].id).toBe("hemp-tee");
    expect(res[res.length - 1].id).toBe("poly-jogger");
  });

  it("sorts by price ascending", () => {
    const res = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, sort: "price-asc" }, index);
    expect(res[0].id).toBe("poly-jogger");
  });
});

describe("facetCounts", () => {
  it("counts fabrics without applying the fabric filter itself", () => {
    const counts = facetCounts(PRODUCTS, { ...EMPTY_FILTERS, fabrics: ["hemp"] }, index);
    expect(counts.fabrics.get("linen")).toBe(1);
    expect(counts.fabrics.get("hemp")).toBe(1);
  });

  it("counts brands and sizes with other filters applied", () => {
    const counts = facetCounts(PRODUCTS, { ...EMPTY_FILTERS, maxPrice: 19 }, index);
    // only hemp-tee (£18) and poly-jogger (£16) are <= £19
    expect(counts.brands.get("zara")).toBe(1);
    expect(counts.brands.get("seasalt")).toBe(1);
    expect(counts.sizes.get("XL")).toBe(1);
  });

  it("brand counts ignore the brand filter itself (so Zara stays visible when Seasalt is ticked)", () => {
    const counts = facetCounts(PRODUCTS, { ...EMPTY_FILTERS, brands: ["seasalt"] }, index);
    expect(counts.brands.get("zara")).toBe(2);
  });
});

describe("URL round-trip", () => {
  it("serializes and parses back identically", () => {
    const filters = {
      ...EMPTY_FILTERS,
      q: "linen top",
      fabrics: ["linen", "hemp"] as Product["fabric_composition"][number]["material"][],
      brands: ["zara", "seasalt"],
      sizes: ["M", "L"],
      colors: ["Black"],
      certs: ["GOTS"],
      maxPrice: 40,
      minScore: 60,
      sort: "score" as const,
    };
    const parsed = paramsToFilters(filtersToParams(filters));
    expect(parsed).toEqual(filters);
  });

  it("parses empty params to EMPTY_FILTERS", () => {
    expect(paramsToFilters(new URLSearchParams())).toEqual(EMPTY_FILTERS);
  });
});
