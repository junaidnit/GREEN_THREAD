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

const brand = {
  slug: "b", name: "Brand", website: "https://b.example.com",
  ethics_summary: "", certifications: [], ethics_modifier: 0,
};

const PRODUCTS: Product[] = [
  {
    id: "linen-shirt", brand, title: "Breezy Linen Shirt", description: "cool summer shirt",
    category: "shirts", gender: "men", price: 3499, currency: "INR", retailer: "R",
    buy_url: "#", image_url: "#", color: "white",
    fabric_composition: [{ material: "linen", label: "Linen", pct: 100 }],
    sustainability: sus(85, ["European Flax", "OEKO-TEX Standard 100"]),
  },
  {
    id: "hemp-tee", brand, title: "Hemp Tee", description: "rugged tee",
    category: "t-shirts", gender: "unisex", price: 1799, currency: "INR", retailer: "R",
    buy_url: "#", image_url: "#", color: "natural",
    fabric_composition: [
      { material: "hemp", label: "Hemp", pct: 55 },
      { material: "organic_cotton", label: "Organic cotton", pct: 45 },
    ],
    sustainability: sus(88, ["USDA Organic"]),
  },
  {
    id: "poly-jogger", brand, title: "Comfy Jogger", description: "cosy fleece jogger",
    category: "trousers", gender: "women", price: 1599, currency: "INR", retailer: "R",
    buy_url: "#", image_url: "#", color: "grey",
    fabric_composition: [
      { material: "bci_cotton", label: "BCI cotton", pct: 65 },
      { material: "polyester", label: "Polyester", pct: 35 },
    ],
    sustainability: sus(40, ["BCI"]),
  },
  {
    id: "trace-elastane", brand, title: "Stretch Top", description: "top with trace stretch",
    category: "t-shirts", gender: "women", price: 2000, currency: "INR", retailer: "R",
    buy_url: "#", image_url: "#", color: "black",
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

  it("filters by max price and min score", () => {
    const res = applyFilters(
      PRODUCTS,
      { ...EMPTY_FILTERS, maxPrice: 2000, minScore: 65 },
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
    // linen still visible as an option even though hemp is selected
    expect(counts.fabrics.get("linen")).toBe(1);
    expect(counts.fabrics.get("hemp")).toBe(1);
  });

  it("applies other filters when counting a group", () => {
    const counts = facetCounts(PRODUCTS, { ...EMPTY_FILTERS, maxPrice: 1700 }, index);
    // only poly-jogger is <= 1700
    expect(counts.fabrics.get("linen") ?? 0).toBe(0);
    expect(counts.fabrics.get("bci_cotton")).toBe(1);
  });
});

describe("URL round-trip", () => {
  it("serializes and parses back identically", () => {
    const filters = {
      ...EMPTY_FILTERS,
      q: "linen shirt",
      fabrics: ["linen", "hemp"] as Product["fabric_composition"][number]["material"][],
      certs: ["GOTS"],
      maxPrice: 4000,
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
