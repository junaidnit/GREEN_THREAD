import MiniSearch from "minisearch";
import type { MaterialId, Product } from "./types";
import { MATERIAL_LABELS } from "./scoring";

/**
 * Client-side instant search + faceted filtering.
 * The whole enriched catalog is small; indexing it in the browser gives
 * <1ms queries with typo tolerance — the "search feels instant" core.
 */

/** Shopper-language synonyms per category, so "top" finds tees/shirts/knits. */
const CATEGORY_SYNONYMS: Record<string, string> = {
  "t-shirts": "top tops tee tees t-shirt tshirt",
  shirts: "top tops shirt blouse button-up overshirt",
  knitwear: "top tops jumper sweater pullover cardigan knit turtleneck",
  hoodies: "top tops hoodie sweatshirt crew fleece",
  dresses: "dress dresses midi maxi jumpsuit occasionwear",
  trousers: "trousers pants jeans bottoms shorts joggers chinos",
  skirts: "skirt skirts bottoms",
  activewear: "activewear gym sportswear workout leggings sports bra running",
  outerwear: "jacket coat outerwear layer parka blazer vest gilet",
  accessories: "accessory accessories hat scarf bag tote beanie socks apron blanket",
};

export interface Filters {
  q: string;
  fabrics: MaterialId[];
  brands: string[];
  sizes: string[];
  colors: string[];
  certs: string[];
  categories: string[];
  gender: string | null;
  maxPrice: number | null;
  minScore: number | null;
  sort: "relevance" | "score" | "price-asc" | "price-desc";
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  fabrics: [],
  brands: [],
  sizes: [],
  colors: [],
  certs: [],
  categories: [],
  gender: null,
  maxPrice: null,
  minScore: null,
  sort: "relevance",
};

export function buildIndex(products: Product[]): MiniSearch {
  const mini = new MiniSearch({
    fields: ["title", "description", "brand", "category", "synonyms", "color", "fabrics", "certs"],
    storeFields: ["id"],
    searchOptions: {
      boost: { title: 3, synonyms: 2.5, fabrics: 2.5, brand: 2, category: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  mini.addAll(
    products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      brand: p.brand.name,
      category: p.category,
      synonyms: `${CATEGORY_SYNONYMS[p.category] ?? ""} ${p.gender}`,
      color: `${p.color} ${p.color_family}`,
      fabrics: p.fabric_composition
        .map((f) => `${f.label} ${MATERIAL_LABELS[f.material]}`)
        .join(" "),
      certs: p.sustainability.certifications.join(" "),
    })),
  );
  return mini;
}

/** Does product contain ANY of the selected fabrics (with a meaningful share)? */
function matchesFabrics(p: Product, fabrics: MaterialId[]): boolean {
  if (fabrics.length === 0) return true;
  return p.fabric_composition.some((f) => fabrics.includes(f.material) && f.pct >= 5);
}

function matchesFacets(p: Product, f: Filters, skip?: keyof Filters): boolean {
  if (skip !== "fabrics" && !matchesFabrics(p, f.fabrics)) return false;
  if (skip !== "brands" && f.brands.length > 0 && !f.brands.includes(p.brand.slug)) return false;
  if (skip !== "sizes" && f.sizes.length > 0 &&
      !f.sizes.some((s) => p.sizes.includes(s))) return false;
  if (skip !== "colors" && f.colors.length > 0 && !f.colors.includes(p.color_family)) return false;
  if (skip !== "certs" && f.certs.length > 0 &&
      !f.certs.every((c) => p.sustainability.certifications.includes(c))) return false;
  if (skip !== "categories" && f.categories.length > 0 &&
      !f.categories.includes(p.category)) return false;
  if (skip !== "gender" && f.gender && p.gender !== f.gender && p.gender !== "unisex") return false;
  if (skip !== "maxPrice" && f.maxPrice != null && p.price > f.maxPrice) return false;
  if (skip !== "minScore" && f.minScore != null && p.sustainability.score < f.minScore) return false;
  return true;
}

export function applyFilters(
  products: Product[],
  filters: Filters,
  index: MiniSearch | null,
): Product[] {
  let pool = products;

  if (filters.q.trim() && index) {
    const hits = index.search(filters.q.trim());
    const rank = new Map(hits.map((h, i) => [h.id as string, i]));
    pool = products
      .filter((p) => rank.has(p.id))
      .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  }

  const filtered = pool.filter((p) => matchesFacets(p, filters));

  switch (filters.sort) {
    case "score":
      return [...filtered].sort((a, b) => b.sustainability.score - a.sustainability.score);
    case "price-asc":
      return [...filtered].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...filtered].sort((a, b) => b.price - a.price);
    default:
      return filters.q.trim()
        ? filtered // already relevance-ordered by the index
        : [...filtered].sort((a, b) => b.sustainability.score - a.sustainability.score);
  }
}

export interface FacetCounts {
  fabrics: Map<MaterialId, number>;
  brands: Map<string, number>;
  sizes: Map<string, number>;
  colors: Map<string, number>;
  certs: Map<string, number>;
  categories: Map<string, number>;
}

/**
 * Standard faceting: the count shown next to option X reflects all active
 * filters EXCEPT its own group, so options never look impossible to combine.
 */
export function facetCounts(products: Product[], filters: Filters, index: MiniSearch | null): FacetCounts {
  let pool = products;
  if (filters.q.trim() && index) {
    const ids = new Set(index.search(filters.q.trim()).map((h) => h.id as string));
    pool = products.filter((p) => ids.has(p.id));
  }

  const fabrics = new Map<MaterialId, number>();
  const brands = new Map<string, number>();
  const sizes = new Map<string, number>();
  const colors = new Map<string, number>();
  const certs = new Map<string, number>();
  const categories = new Map<string, number>();

  for (const p of pool) {
    if (matchesFacets(p, filters, "fabrics")) {
      for (const f of p.fabric_composition) {
        if (f.pct >= 5) fabrics.set(f.material, (fabrics.get(f.material) ?? 0) + 1);
      }
    }
    if (matchesFacets(p, filters, "brands")) {
      brands.set(p.brand.slug, (brands.get(p.brand.slug) ?? 0) + 1);
    }
    if (matchesFacets(p, filters, "sizes")) {
      for (const s of p.sizes) sizes.set(s, (sizes.get(s) ?? 0) + 1);
    }
    if (matchesFacets(p, filters, "colors")) {
      colors.set(p.color_family, (colors.get(p.color_family) ?? 0) + 1);
    }
    if (matchesFacets(p, filters, "certs")) {
      for (const c of p.sustainability.certifications) {
        certs.set(c, (certs.get(c) ?? 0) + 1);
      }
    }
    if (matchesFacets(p, filters, "categories")) {
      categories.set(p.category, (categories.get(p.category) ?? 0) + 1);
    }
  }

  return { fabrics, brands, sizes, colors, certs, categories };
}

/* ── URL <-> Filters (shareable, back-button-friendly state) ── */

export function filtersToParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.fabrics.length) sp.set("fabric", f.fabrics.join(","));
  if (f.brands.length) sp.set("brand", f.brands.join(","));
  if (f.sizes.length) sp.set("size", f.sizes.join(","));
  if (f.colors.length) sp.set("color", f.colors.join(","));
  if (f.certs.length) sp.set("cert", f.certs.join(","));
  if (f.categories.length) sp.set("category", f.categories.join(","));
  if (f.gender) sp.set("gender", f.gender);
  if (f.maxPrice != null) sp.set("max", String(f.maxPrice));
  if (f.minScore != null) sp.set("minScore", String(f.minScore));
  if (f.sort !== "relevance") sp.set("sort", f.sort);
  return sp;
}

export function paramsToFilters(sp: URLSearchParams): Filters {
  const list = (k: string) => sp.get(k)?.split(",").filter(Boolean) ?? [];
  const num = (k: string) => {
    const v = Number(sp.get(k));
    return Number.isFinite(v) && sp.get(k) !== null ? v : null;
  };
  const sort = sp.get("sort");
  return {
    q: sp.get("q") ?? "",
    fabrics: list("fabric") as MaterialId[],
    brands: list("brand"),
    sizes: list("size"),
    colors: list("color"),
    certs: list("cert"),
    categories: list("category"),
    gender: sp.get("gender"),
    maxPrice: num("max"),
    minScore: num("minScore"),
    sort: sort === "score" || sort === "price-asc" || sort === "price-desc" ? sort : "relevance",
  };
}
