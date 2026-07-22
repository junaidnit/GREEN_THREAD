import MiniSearch from "minisearch";
import type { CatalogCard, MaterialId } from "./types";
import { MATERIAL_LABELS } from "./scoring";
import { oilDerivedPct } from "./materials";

/**
 * Client-side instant search + faceted filtering.
 * The whole enriched catalog is small; indexing it in the browser gives
 * <1ms queries with typo tolerance, the "search feels instant" core.
 */

/** Shopper-language synonyms per category, so "top" finds tees/shirts/knits. */
const CATEGORY_SYNONYMS: Record<string, string> = {
  "t-shirts": "top tops tee tees t-shirt tshirt",
  shirts: "top tops shirt blouse button-up overshirt",
  knitwear: "top tops jumper sweater pullover cardigan knit turtleneck",
  hoodies: "top tops hoodie hoody hoodys sweatshirt jumper crew fleece",
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
  fits: string[];
  certs: string[];
  categories: string[];
  gender: string | null;
  maxPrice: number | null;
  minScore: number | null;
  /** The master switch: hide anything containing oil-derived plastic (incl. recycled). */
  noSynthetics: boolean;
  /** Only real listings ingested from a brand's own live feed. */
  liveOnly: boolean;
  sort: "relevance" | "natural" | "score" | "price-asc" | "price-desc";
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  fabrics: [],
  brands: [],
  sizes: [],
  colors: [],
  fits: [],
  certs: [],
  categories: [],
  gender: null,
  maxPrice: null,
  minScore: null,
  noSynthetics: false,
  liveOnly: false,
  sort: "relevance",
};

export function buildIndex(products: CatalogCard[]): MiniSearch {
  const mini = new MiniSearch({
    fields: ["title", "brand", "category", "synonyms", "color", "fabrics", "certs"],
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
      brand: p.brand.name,
      category: p.category,
      synonyms: `${CATEGORY_SYNONYMS[p.category] ?? ""} ${p.gender} ${p.fit}`,
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
function matchesFabrics(p: CatalogCard, fabrics: MaterialId[]): boolean {
  if (fabrics.length === 0) return true;
  return p.fabric_composition.some((f) => fabrics.includes(f.material) && f.pct >= 5);
}

function matchesFacets(p: CatalogCard, f: Filters, skip?: keyof Filters): boolean {
  if (skip !== "noSynthetics" && f.noSynthetics && oilDerivedPct(p.fabric_composition) > 0) return false;
  if (skip !== "liveOnly" && f.liveOnly && p.source !== "live") return false;
  if (skip !== "fabrics" && !matchesFabrics(p, f.fabrics)) return false;
  if (skip !== "brands" && f.brands.length > 0 && !f.brands.includes(p.brand.slug)) return false;
  if (skip !== "sizes" && f.sizes.length > 0 &&
      !f.sizes.some((s) => p.sizes.includes(s))) return false;
  if (skip !== "colors" && f.colors.length > 0 && !f.colors.includes(p.color_family)) return false;
  if (skip !== "fits" && f.fits.length > 0 && !f.fits.includes(p.fit)) return false;
  if (skip !== "certs" && f.certs.length > 0 &&
      !f.certs.every((c) => p.sustainability.certifications.includes(c))) return false;
  if (skip !== "categories" && f.categories.length > 0 &&
      !f.categories.includes(p.category)) return false;
  if (skip !== "gender" && f.gender && p.gender !== f.gender && p.gender !== "unisex") return false;
  if (skip !== "maxPrice" && f.maxPrice != null && p.price > f.maxPrice) return false;
  if (skip !== "minScore" && f.minScore != null && p.sustainability.score < f.minScore) return false;
  return true;
}

/**
 * Precision-first text search: multi-word queries must match ALL terms
 * (stops "t shirt" flooding to the whole catalog via the stray "t");
 * falls back to ANY-term matching only when strict matching finds little.
 */
export function searchHits(index: MiniSearch, q: string) {
  const strict = index.search(q, { combineWith: "AND" });
  if (strict.length >= 3 || !q.trim().includes(" ")) return strict;
  return index.search(q); // OR fallback for sparse multi-word queries
}

export function applyFilters<T extends CatalogCard>(
  products: T[],
  filters: Filters,
  index: MiniSearch | null,
): T[] {
  let pool = products;

  if (filters.q.trim() && index) {
    const hits = searchHits(index, filters.q.trim());
    const rank = new Map(hits.map((h, i) => [h.id as string, i]));
    pool = products
      .filter((p) => rank.has(p.id))
      .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  }

  const filtered = pool.filter((p) => matchesFacets(p, filters));

  switch (filters.sort) {
    case "natural":
      return [...filtered].sort(
        (a, b) =>
          oilDerivedPct(a.fabric_composition) - oilDerivedPct(b.fabric_composition) ||
          b.sustainability.score - a.sustainability.score,
      );
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
  fits: Map<string, number>;
  certs: Map<string, number>;
  categories: Map<string, number>;
}

/**
 * Standard faceting: the count shown next to option X reflects all active
 * filters EXCEPT its own group, so options never look impossible to combine.
 */
export function facetCounts(products: CatalogCard[], filters: Filters, index: MiniSearch | null): FacetCounts {
  let pool = products;
  if (filters.q.trim() && index) {
    const ids = new Set(searchHits(index, filters.q.trim()).map((h) => h.id as string));
    pool = products.filter((p) => ids.has(p.id));
  }

  const fabrics = new Map<MaterialId, number>();
  const brands = new Map<string, number>();
  const sizes = new Map<string, number>();
  const colors = new Map<string, number>();
  const fits = new Map<string, number>();
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
    if (matchesFacets(p, filters, "fits")) {
      fits.set(p.fit, (fits.get(p.fit) ?? 0) + 1);
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

  return { fabrics, brands, sizes, colors, fits, certs, categories };
}

/**
 * Closest matches for a query that found nothing under active filters, * fuzzy ANY-term search, ignoring facets. Powers the helpful empty state.
 */
export function closestMatches<T extends CatalogCard>(
  products: T[],
  q: string,
  index: MiniSearch | null,
  limit = 4,
): T[] {
  if (!q.trim() || !index) return [];
  const hits = index.search(q.trim(), { fuzzy: 0.3, prefix: true });
  const rank = new Map(hits.map((h, i) => [h.id as string, i]));
  return products
    .filter((p) => rank.has(p.id))
    .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)
    .slice(0, limit);
}

/* ── URL <-> Filters (shareable, back-button-friendly state) ── */

export function filtersToParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.fabrics.length) sp.set("fabric", f.fabrics.join(","));
  if (f.brands.length) sp.set("brand", f.brands.join(","));
  if (f.sizes.length) sp.set("size", f.sizes.join(","));
  if (f.colors.length) sp.set("color", f.colors.join(","));
  if (f.fits.length) sp.set("fit", f.fits.join(","));
  if (f.certs.length) sp.set("cert", f.certs.join(","));
  if (f.categories.length) sp.set("category", f.categories.join(","));
  if (f.gender) sp.set("gender", f.gender);
  if (f.maxPrice != null) sp.set("max", String(f.maxPrice));
  if (f.minScore != null) sp.set("minScore", String(f.minScore));
  if (f.noSynthetics) sp.set("pure", "1");
  if (f.liveOnly) sp.set("live", "1");
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
    fits: list("fit"),
    certs: list("cert"),
    categories: list("category"),
    gender: sp.get("gender"),
    maxPrice: num("max"),
    minScore: num("minScore"),
    noSynthetics: sp.get("pure") === "1",
    liveOnly: sp.get("live") === "1",
    sort:
      sort === "natural" || sort === "score" || sort === "price-asc" || sort === "price-desc"
        ? sort
        : "relevance",
  };
}
