import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Retailer checkout (demo)",
  robots: { index: false },
};

/** Per-retailer look so the handoff feels real. */
const RETAILER_THEMES: Record<string, { bg: string; fg: string; accent: string; tagline: string }> = {
  ASOS: { bg: "#0d0d0d", fg: "#ffffff", accent: "#018849", tagline: "FREE DELIVERY & RETURNS*" },
  "John Lewis": { bg: "#ffffff", fg: "#141414", accent: "#037c58", tagline: "Never Knowingly Undersold on quality" },
  Zalando: { bg: "#ff6900", fg: "#ffffff", accent: "#1a1a1a", tagline: "Free delivery & 100-day returns" },
  "Brand Direct": { bg: "#20241f", fg: "#f5f2ea", accent: "#7fc9a2", tagline: "Direct from the maker" },
};

export default async function RetailerCheckout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const theme = RETAILER_THEMES[product.retailer] ?? RETAILER_THEMES["Brand Direct"];
  const delivery = product.price >= 50 ? 0 : 3.95;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* demo notice */}
      <div className="mb-4 rounded-lg border border-grade-c/40 bg-grade-c/10 px-4 py-2.5 text-center text-xs">
        <b>Demo handoff</b> — this simulates landing directly in {product.retailer}&apos;s checkout,
        exactly how the affiliate deeplink will work with live retailer feeds.{" "}
        <Link href={`/product/${id}`} className="font-medium underline">Back to The Fibre Set</Link>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-border shadow-xl" data-testid="retailer-checkout">
        {/* retailer chrome */}
        <div style={{ background: theme.bg, color: theme.fg }} className="px-6 py-4">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-2xl font-black tracking-tight">{product.retailer}</p>
            <p className="text-xs opacity-80">{theme.tagline}</p>
          </div>
        </div>

        <div className="bg-surface p-6">
          <h1 className="font-display text-lg font-bold">Your bag — 1 item</h1>

          <div className="mt-4 flex gap-4 rounded-xl border border-border p-4">
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              <Image src={product.image_url} alt={product.title} fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
              <p className="truncate font-medium">{product.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Colour: {product.color} · Size: {product.sizes[0] ?? "One size"} · Qty: 1
              </p>
              <p className="mt-1.5 font-display font-semibold">{formatPrice(product.price, product.currency)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(product.price, product.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>{delivery === 0 ? "Free" : formatPrice(delivery, product.currency)}</span>
            </div>
            <div className="flex justify-between pt-1 font-display text-base font-bold">
              <span>Total</span>
              <span data-testid="checkout-total">
                {formatPrice(product.price + delivery, product.currency)}
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="retailer-pay-button"
            style={{ background: theme.accent, color: theme.bg === "#ffffff" ? "#ffffff" : theme.fg }}
            className="mt-5 w-full cursor-not-allowed rounded-full py-3.5 font-semibold opacity-95"
            title="Demo checkout — payment disabled"
          >
            Checkout securely
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Payment is disabled in the demo. With live feeds this page is the retailer&apos;s own checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
