import "server-only";
import { cache } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Brand, Product, SeedProduct } from "./types";

/**
 * Server-side catalog loader.
 * Primary source: Supabase (when NEXT_PUBLIC_SUPABASE_URL is configured).
 * Fallback: the checked-in enriched seed file — so the app (and Playwright)
 * always runs, even with no network or env configured.
 */

function loadLocal(): Product[] {
  const seed = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/products_seed.json"), "utf8"),
  ).products as SeedProduct[];
  const brands = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/raw/brands.json"), "utf8"),
  ).brands as Brand[];
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return seed.map(({ brand_slug, ...rest }) => ({
    ...rest,
    brand: brandBySlug.get(brand_slug)!,
  }));
}

async function loadSupabase(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("products")
    .select("*, brand:brands(*)")
    .order("id");
  if (error) throw error;
  return (data ?? []).map((row) => ({
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

export async function getProduct(id: string): Promise<Product | undefined> {
  const all = await getCatalog();
  return all.find((p) => p.id === id);
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
