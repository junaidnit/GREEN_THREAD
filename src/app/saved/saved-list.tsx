"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CatalogCard } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { getSaved } from "@/components/saved";
import { formatPrice } from "@/lib/format";

export function SavedList({ products }: { products: CatalogCard[] }) {
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    const update = () => setIds(getSaved());
    update();
    window.addEventListener("gt:saved", update);
    return () => window.removeEventListener("gt:saved", update);
  }, []);

  if (ids === null) return null; // avoid SSR/localStorage mismatch flash

  const saved = products.filter((p) => ids.includes(p.id));
  const total = saved.reduce((s, p) => s + p.price, 0);
  const avg = saved.length
    ? Math.round(saved.reduce((s, p) => s + p.sustainability.score, 0) / saved.length)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Your wardrobe</h1>
          {saved.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {saved.length} saved · {formatPrice(total, "GBP")} total · average score{" "}
              <b className="text-foreground">{avg}</b>/100
            </p>
          )}
        </div>
        <Link href="/search" className="text-sm font-medium text-primary hover:underline">
          Keep browsing →
        </Link>
      </div>

      {saved.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4" data-testid="saved-grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl2 border border-dashed border-border py-20 text-center">
          <p className="font-display text-lg font-semibold">Nothing saved yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Tap <b>Save</b> on any product and it lands here — watch for the little arc into the heart.
          </p>
        </div>
      )}
    </div>
  );
}
