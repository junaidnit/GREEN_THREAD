import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProduct } from "@/lib/catalog";

/**
 * Outbound click handler — the affiliate deeplink pattern.
 * Records the click (stdout for the MVP; analytics/affiliate network later)
 * and sends the shopper straight to the retailer checkout, BuyHatke-style.
 * In production this would 302 to a real affiliate deeplink for the retailer.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.redirect(new URL("/search", _req.url));
  }

  console.log(
    `[out-click] ${new Date().toISOString()} product=${id} retailer=${product.retailer} price=£${product.price}`,
  );
  // affiliate-grade click log (fire and forget)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    createClient(url, key)
      .from("events")
      .insert({ type: "out_click", payload: { product: id, retailer: product.retailer, price: product.price } })
      .then(() => {}, () => {});
  }

  // live-ingested products have a REAL product page — send the shopper there.
  // concept/demo items go to the simulated checkout instead.
  if (product.source === "live" && /^https?:\/\//.test(product.buy_url)) {
    return NextResponse.redirect(product.buy_url);
  }
  return NextResponse.redirect(new URL(`/retailer/${id}`, _req.url));
}
