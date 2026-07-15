import "server-only";
import { cache } from "react";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { dataPath } from "./data-root";
import type { Brand, CatalogCard, FabricPart, Product, SeedProduct } from "./types";

/**
 * Server-side catalog loader.
 * Primary source: Supabase (when NEXT_PUBLIC_SUPABASE_URL is configured).
 * Fallback: the checked-in enriched seed file — so the app (and Playwright)
 * always runs, even with no network or env configured.
 */

function loadLocal(): Product[] {
  const seed = JSON.parse(
    readFileSync(dataPath("data", "products_seed.json"), "utf8"),
  ).products as SeedProduct[];
  const generatedPath = dataPath("data", "products_generated.json");
  const generated: SeedProduct[] = existsSync(generatedPath)
    ? JSON.parse(readFileSync(generatedPath, "utf8")).products
    : [];
  // real products ingested from live brand feeds — real URLs, photos, prices
  const livePath = dataPath("data", "products_live.json");
  const live: SeedProduct[] = existsSync(livePath)
    ? JSON.parse(readFileSync(livePath, "utf8")).products
    : [];
  const brands = JSON.parse(
    readFileSync(dataPath("data", "raw", "brands.json"), "utf8"),
  ).brands as Brand[];
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return [...live, ...seed, ...generated].map(({ brand_slug, ...rest }) => ({
    ...rest,
    brand: brandBySlug.get(brand_slug)!,
  }));
}

async function loadSupabase(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  // PostgREST caps a single request at 1,000 rows — page through the catalog
  const PAGE = 1000;
  const data: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from("products")
      .select("*, brand:brands(*)")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    data.push(...(page ?? []));
    if (!page || page.length < PAGE) break;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    brand: row.brand as Brand,
    title: row.title,
    description: row.description,
    category: row.category,
    gender: row.gender,
    price: row.price,
    currency: row.currency,
    retailer: row.retailer,
    buy_url: row.buy_url,
    image_url: row.image_url,
    color: row.color,
    color_family: row.color_family ?? "",
    sizes: row.sizes ?? [],
    fit: row.fit ?? "Regular",
    source: row.source ?? undefined,
    price_history: row.price_history ?? undefined,
    fabric_composition: row.fabric_composition,
    sustainability: row.sustainability,
  }));
}

export const getCatalog = cache(async (): Promise<Product[]> => {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.CATALOG_SOURCE !== "local"
  ) {
    try {
      const products = await loadSupabase();
      if (products.length > 0) return products;
      console.warn("[catalog] Supabase returned 0 products — using local seed");
    } catch (e) {
      console.warn("[catalog] Supabase unavailable — using local seed:", e);
    }
  }
  return loadLocal();
});

/**
 * Slim projection for the search page — drops descriptions, factor
 * breakdowns and buy URLs so shipping ~1,600 products to the client stays
 * a fraction of the full catalog payload.
 */
export const getCatalogCards = cache(async (): Promise<CatalogCard[]> => {
  const all = await getCatalog();
  const drop = (p: Product) => {
    const h = p.price_history;
    if (!h || h.length < 2) return {};
    const prev = h[h.length - 2].price;
    return prev > p.price ? { price_dropped: true, was_price: prev } : {};
  };
  return all.map((p) => ({
    ...drop(p),
    id: p.id,
    brand: { slug: p.brand.slug, name: p.brand.name },
    title: p.title,
    category: p.category,
    gender: p.gender,
    price: p.price,
    currency: p.currency,
    retailer: p.retailer,
    image_url: p.image_url,
    color: p.color,
    color_family: p.color_family,
    sizes: p.sizes,
    fit: p.fit,
    source: p.source,
    fabric_composition: p.fabric_composition,
    sustainability: {
      score: p.sustainability.score,
      grade: p.sustainability.grade,
      certifications: p.sustainability.certifications,
      greenwash_flags: p.sustainability.greenwash_flags,
    },
  }));
});

export async function getProduct(id: string): Promise<Product | undefined> {
  const all = await getCatalog();
  return all.find((p) => p.id === id);
}

/**
 * "Better fibre, same money": same category, similar price (±25%),
 * strictly less oil-derived plastic — the upgrade path, not an upsell.
 */
export async function getBetterFibre(product: Product, limit = 4): Promise<Product[]> {
  const { oilDerivedPct } = await import("./materials");
  const all = await getCatalog();
  const myPlastic = oilDerivedPct(product.fabric_composition);
  if (myPlastic === 0) return []; // already plastic-free — nothing to upgrade
  return all
    .filter(
      (p) =>
        p.id !== product.id &&
        p.category === product.category &&
        p.gender !== (product.gender === "men" ? "women" : product.gender === "women" ? "men" : "") &&
        Math.abs(p.price - product.price) <= product.price * 0.25 &&
        oilDerivedPct(p.fabric_composition) < myPlastic,
    )
    .sort(
      (a, b) =>
        oilDerivedPct(a.fabric_composition) - oilDerivedPct(b.fabric_composition) ||
        Math.abs(a.price - product.price) - Math.abs(b.price - product.price),
    )
    .slice(0, limit);
}

/**
 * Cross-site "better fibre" match — for products we don't have a Product
 * record for (an item on someone else's site, scraped by the browser
 * extension). Same upgrade logic as getBetterFibre, working from
 * a guessed category + composition instead of a catalog id.
 */
export async function getBetterFibreMatch(
  input: { category: string; price: number | null; fabricComposition: FabricPart[] },
  limit = 4,
): Promise<CatalogCard[]> {
  const { oilDerivedPct } = await import("./materials");
  const cards = await getCatalogCards();
  const myPlastic = oilDerivedPct(input.fabricComposition);
  if (myPlastic === 0) return [];
  return cards
    .filter(
      (c) =>
        c.category === input.category &&
        oilDerivedPct(c.fabric_composition) < myPlastic &&
        (input.price == null || Math.abs(c.price - input.price) <= input.price * 0.35),
    )
    .sort(
      (a, b) =>
        (a.source === "live" ? 0 : 1) - (b.source === "live" ? 0 : 1) ||
        oilDerivedPct(a.fabric_composition) - oilDerivedPct(b.fabric_composition) ||
        (input.price == null ? 0 : Math.abs(a.price - input.price) - Math.abs(b.price - input.price)),
    )
    .slice(0, limit);
}

/** Naive similar-items: shared dominant fabric or category, ranked by score. */
export async function getSimilar(product: Product, limit = 4): Promise<Product[]> {
  const all = await getCatalog();
  const dominant = [...product.fabric_composition].sort((a, b) => b.pct - a.pct)[0]?.material;
  return all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let affinity = 0;
      if (p.category === product.category) affinity += 2;
      if (p.fabric_composition.some((f) => f.material === dominant && f.pct >= 30)) affinity += 3;
      if (p.brand.slug === product.brand.slug) affinity += 1;
      return { p, affinity };
    })
    .filter((x) => x.affinity > 0)
    .sort((a, b) => b.affinity - a.affinity || b.p.sustainability.score - a.p.sustainability.score)
    .slice(0, limit)
    .map((x) => x.p);
}
