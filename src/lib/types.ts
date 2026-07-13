/** Canonical material ids used across the app (filter facets, scoring). */
export type MaterialId =
  | "organic_cotton"
  | "recycled_cotton"
  | "conventional_cotton"
  | "bci_cotton"
  | "linen"
  | "hemp"
  | "tencel_lyocell"
  | "modal"
  | "cupro"
  | "viscose"
  | "merino_wool"
  | "lambswool"
  | "recycled_wool"
  | "virgin_wool"
  | "peace_silk"
  | "recycled_polyester"
  | "polyester"
  | "recycled_polyamide"
  | "polyamide"
  | "elastane"
  | "other";

export interface FabricPart {
  material: MaterialId;
  /** Human label as shown on the garment label, e.g. "TENCEL™ Lyocell" */
  label: string;
  pct: number;
}

/** Practice flags the extraction agent detects in product copy. */
export interface Practices {
  natural_dye: boolean;
  undyed: boolean;
  deadstock: boolean;
  pfc_free: boolean;
  repair_program: boolean;
  take_back: boolean;
  zero_waste: boolean;
  made_to_order: boolean;
}

export interface ScoreFactor {
  label: string;
  /** Signed contribution in points. */
  points: number;
  detail: string;
}

export interface Sustainability {
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "E";
  factors: ScoreFactor[];
  /** Plain-language explanation written by the enrichment agent. */
  explanation: string;
  /** Claims found in copy that lack certification/evidence. */
  greenwash_flags: string[];
  certifications: string[];
  practices: Practices;
}

export interface Brand {
  slug: string;
  name: string;
  website: string;
  ethics_summary: string;
  certifications: string[];
  /** 0–6 points added to product scores, from brand-level ethics. */
  ethics_modifier: number;
}

export interface Product {
  id: string; // slug
  brand: Brand;
  title: string;
  description: string;
  category: string;
  gender: "men" | "women" | "unisex";
  price: number;
  currency: string;
  retailer: string;
  buy_url: string;
  image_url: string;
  color: string;
  /** Normalized colour family for filtering, e.g. "Blue", "White & Cream". */
  color_family: string;
  /** Available sizes, e.g. ["XS","S","M"] or ["One size"]. */
  sizes: string[];
  /** Fit type: Regular, Slim, Relaxed, Oversized, Wide. */
  fit: string;
  /** How the record was produced: "extracted" (AI pipeline from label text), "generated" (demo), or "live" (brand feed). */
  source?: string;
  /** Price observations from the sentinel, oldest first. */
  price_history?: Array<{ date: string; price: number }>;
  fabric_composition: FabricPart[];
  sustainability: Sustainability;
}

/**
 * Slim projection shipped to the search page — everything cards, search and
 * facets need, nothing more. Product is structurally assignable to this.
 */
export interface CatalogCard {
  id: string;
  brand: Pick<Brand, "slug" | "name">;
  title: string;
  category: string;
  gender: "men" | "women" | "unisex";
  price: number;
  currency: string;
  retailer: string;
  image_url: string;
  color: string;
  color_family: string;
  sizes: string[];
  fit: string;
  /** "live" = real product ingested from the brand's own feed. */
  source?: string;
  /** True when the sentinel saw the price fall on its last pass. */
  price_dropped?: boolean;
  /** The price before the drop (only set when price_dropped). */
  was_price?: number;
  fabric_composition: FabricPart[];
  sustainability: Pick<Sustainability, "score" | "grade" | "certifications" | "greenwash_flags">;
}

/** Shape stored in data/products_seed.json (brand as slug reference). */
export interface SeedProduct extends Omit<Product, "brand"> {
  brand_slug: string;
}
