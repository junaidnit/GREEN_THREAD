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
 * Fallback: the checked-in enriched seed file, so the app (and Playwright)
 * always runs, even with no network or env configured.
 */

/**
 * REAL PRODUCTS ONLY. The catalog is exclusively items ingested from brands'
 * own live feeds, real photos, prices, and buy-links. The old concept/
 * generated demo items are gone: they carried mismatched stock photos (which
 * wrecked visual similarity) and invented merchant links (which broke Buy).
 * Everything here is a product you can actually purchase.
 */
function loadLocal(): Product[] {
  const livePath = dataPath("data", "products_live.json");
  const live: SeedProduct[] = existsSync(livePath)
    ? JSON.parse(readFileSync(livePath, "utf8")).products
    : [];
  const brands = JSON.parse(
    readFileSync(dataPath("data", "raw", "brands.json"), "utf8"),
  ).brands as Brand[];
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return live
    .filter((p) => p.source === "live" && brandBySlug.has(p.brand_slug))
    .map(({ brand_slug, ...rest }) => ({ ...rest, brand: brandBySlug.get(brand_slug)! }));
}

/**
 * Supabase gets one bounded chance. Unbounded, a hanging upstream burned the
 * whole 60s page budget on Vercel before falling back to the local seed that
 * would have answered instantly, the build failed rather than degraded.
 */
const SUPABASE_TIMEOUT_MS = 3000;

/**
 * Once Supabase has failed in this process, stop paying for it.
 *
 * Every cold serverless instance was waiting out the full timeout before
 * falling back to a local seed that answers instantly, and the local seed is
 * the same data. On a cold start that wait lands directly in the user's face,
 * so a failure is remembered and retried only occasionally.
 */
const SUPABASE_RETRY_AFTER_MS = 5 * 60 * 1000;
let supabaseFailedAt = 0;

async function loadSupabase(): Promise<Product[]> {
  const { url, key } = supabaseConfig()!;
  const supabase = createClient(url, key, {
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }),
    },
  });
  // PostgREST caps a single request at 1,000 rows, page through the catalog
  const PAGE = 1000;
  const data: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from("products")
      .select("*, brand:brands(*)")
      .eq("source", "live") // real products only, never surface legacy demo rows
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

async function loadCatalog(): Promise<Product[]> {
  const recentlyFailed = Date.now() - supabaseFailedAt < SUPABASE_RETRY_AFTER_MS;
  if (supabaseConfig() && process.env.CATALOG_SOURCE !== "local" && !recentlyFailed) {
    try {
      const products = await loadSupabase();
      if (products.length > 0) return products;
      console.warn("[catalog] Supabase returned 0 products, using local seed");
      supabaseFailedAt = Date.now();
    } catch (e) {
      console.warn("[catalog] Supabase unavailable, using local seed:", e);
      supabaseFailedAt = Date.now();
    }
  }
  return loadLocal();
}

/**
 * PROCESS-level cache, deliberately separate from React's `cache()`.
 *
 * `cache()` is scoped to a single request, so during static generation every
 * page re-attempted Supabase and re-paid its timeout. With Supabase timing out
 * on Vercel ("upstream request timeout"), that put /brand/[slug] over the 60s
 * page budget and failed the whole build, and it was why sitemap.xml and
 * llms.txt timed out too. One attempt per process, memoised as a promise so
 * concurrent callers share the same in-flight read.
 *
 * TTL rather than forever: the catalogue is reseeded independently of deploys,
 * and a long-lived server should eventually pick that up.
 */
const CATALOG_TTL_MS = 10 * 60 * 1000;
let catalogPromise: Promise<Product[]> | null = null;
let catalogLoadedAt = 0;

export const getCatalog = cache(async (): Promise<Product[]> => {
  const fresh = Date.now() - catalogLoadedAt < CATALOG_TTL_MS;
  if (!catalogPromise || !fresh) {
    catalogLoadedAt = Date.now();
    catalogPromise = loadCatalog().catch((e) => {
      catalogPromise = null; // a failed read must not be cached as the answer
      throw e;
    });
  }
  return catalogPromise;
});

/**
 * Slim projection for the search page, drops descriptions, factor
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
 * There were two matchers here, getBetterFibre and getSimilar, that ranked
 * on `category` alone and, in getSimilar's case, ignored gender entirely
 * while letting a shared fibre outweigh the category. That is how a navy
 * men's polo came to be offered a pink camisole and a women's dress. Do not
 * reintroduce category-only matching: the promise is "the SAME garment,
 * better fabric", and garment identity has to be a hard gate.
 */

/**
 * Cross-site "better fibre" match, for products we don't have a Product
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

