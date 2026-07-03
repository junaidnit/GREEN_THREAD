import { NextResponse } from "next/server";
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

  return NextResponse.redirect(new URL(`/retailer/${id}`, _req.url));
}
