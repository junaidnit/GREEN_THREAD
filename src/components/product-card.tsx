import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { GradeBadge } from "./grade-badge";

const BLUR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="12"><rect width="9" height="12" fill="#e8e4da"/></svg>`,
  ).toString("base64");

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const dominant = [...product.fabric_composition].sort((a, b) => b.pct - a.pct).slice(0, 2);
  return (
    <Link
      href={`/product/${product.id}`}
      data-testid="product-card"
      className="hover-lift group block overflow-hidden rounded-xl2 border border-border bg-surface"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          placeholder="blur"
          blurDataURL={BLUR}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5">
          <GradeBadge grade={product.sustainability.grade} score={product.sustainability.score} />
        </div>
        {product.sustainability.greenwash_flags.length > 0 && (
          <div
            className="absolute right-2.5 top-2.5 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-grade-d backdrop-blur"
            title="Some marketing claims on this product lack evidence"
          >
            ⚠ vague claims
          </div>
        )}
      </div>
      <div className="space-y-1 p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand.name}
          </p>
          <p className="text-[11px] text-muted-foreground">{product.retailer}</p>
        </div>
        <h3 className="truncate font-medium leading-snug">{product.title}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {dominant.map((f) => `${f.pct}% ${f.label}`).join(" · ")}
        </p>
        <p className="pt-0.5 font-display font-semibold">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="skeleton aspect-[3/4] !rounded-none" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-4 w-1/4" />
      </div>
    </div>
  );
}
