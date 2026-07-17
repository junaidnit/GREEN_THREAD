import "server-only";
import { cache } from "react";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { dataPath } from "./data-root";
import { supabaseConfig } from "./env";
import { rankBetterFibre, type BetterFibreInput, type BetterFibreResult } from "./recommend";
import type { Brand, CatalogCard, Product, SeedProduct } from "./types";

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
  const { url, key } = supabaseConfig()!;
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
  if (supabaseConfig() && process.env.CATALOG_SOURCE !== "local") {
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

/*
 * Recommendation matching lives in match.ts (pure) and twins.ts (index-aware).
 * There were two matchers here — getBetterFibre and getSimilar — that ranked
 * on `category` alone and, in getSimilar's case, ignored gender entirely
 * while letting a shared fibre outweigh the category. That is how a navy
 * men's polo came to be offered a pink camisole and a women's dress. Do not
 * reintroduce category-only matching: the promise is "the SAME garment,
 * better fabric", and garment identity has to be a hard gate.
 */

/**
 * Cross-site "better fibre" match — for products we don't have a Product
 * record for (an item on someone else's site, scraped by the browser
 * extension). Ranking lives in recommend.ts so it stays testable; this is
 * just the catalog read.
 */
export async function getBetterFibreMatch(
  input: BetterFibreInput,
  limit = 4,
): Promise<BetterFibreResult> {
  return rankBetterFibre(await getCatalogCards(), input, limit);
}

