import Image from "next/image";
import Link from "next/link";
import type { CatalogCard } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const BLUR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="12"><rect width="9" height="12" fill="#e8e4da"/></svg>`,
  ).toString("base64");

const GRADE_DOT: Record<string, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  E: "var(--grade-e)",
};

/**
 * Editorial product card — the image IS the design. No border, no box.
 * Brand + price sit quietly beneath; the fabric story and a slim CTA reveal
 * on hover. Sustainability shows as a single subtle glass mark, full
 * breakdown one tap away on the product page.
 */
export function ProductCard({ product, priority = false }: { product: CatalogCard; priority?: boolean }) {
  const dominant = [...product.fabric_composition].sort((a, b) => b.pct - a.pct)[0];
  const s = product.sustainability;
  return (
    <Link href={`/product/${product.id}`} data-testid="product-card" className="group block">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-surface-2"
        style={{ viewTransitionName: `pimg-${product.id.replace(/[^a-zA-Z0-9-]/g, "")}` }}
      >
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
          priority={priority}
          placeholder="blur"
          blurDataURL={BLUR}
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />

        {/* subtle sustainability mark */}
        <span
          data-testid="grade-badge"
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md"
          title={`Sustainability ${s.score}/100`}
        >
          <span className="size-1.5 rounded-full" style={{ background: GRADE_DOT[s.grade] }} />
          {s.grade}
          <span className="opacity-70">{s.score}</span>
        </span>

        {/* hover reveal: fabric story */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <p className="truncate text-[11px] font-medium text-white/90">
            {dominant.pct}% {dominant.label}
          </p>
        </div>
      </div>

      {/* editorial caption */}
      <div className="pt-2.5">
        <p className="eyebrow truncate">{product.brand.name}</p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm leading-snug">{product.title}</h3>
          <p className="shrink-0 text-sm font-medium tabular-nums">{formatPrice(product.price, product.currency)}</p>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/5] !rounded-none" />
      <div className="flex justify-between pt-2.5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-1/5" />
      </div>
    </div>
  );
}
