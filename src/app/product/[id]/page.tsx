import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalog, getProduct, getSimilar } from "@/lib/catalog";
import { formatPrice, titleCase } from "@/lib/format";
import { GradeBadge } from "@/components/grade-badge";
import { ProductCard } from "@/components/product-card";
import { CompositionBars } from "@/components/composition-bars";
import { ScoreDial } from "@/components/score-dial";
import { AlertTriangle, ArrowUpRight, BadgeCheck } from "@/components/icons";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const products = await getCatalog();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return {};
  return {
    title: `${product.title} — ${product.brand.name} | GreenThread`,
    description: product.sustainability.explanation,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const similar = await getSimilar(product);
  const s = product.sustainability;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-5 text-xs text-muted-foreground">
        <Link href="/search" className="hover:text-foreground hover:underline">Browse</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/search?category=${product.category}`} className="hover:text-foreground hover:underline">
          {titleCase(product.category)}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 border border-border bg-surface-2">
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute left-4 top-4">
            <GradeBadge grade={s.grade} score={s.score} size="lg" />
          </div>
        </div>

        {/* info */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand.name} · sold by {product.retailer}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-3 font-display text-2xl font-semibold" data-testid="product-price">
            {formatPrice(product.price, product.currency)}
          </p>

          <a
            href={product.buy_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            data-testid="buy-button"
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] sm:max-w-sm"
          >
            Buy at {product.retailer} <ArrowUpRight className="size-4" />
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Demo catalog — outbound links are illustrative.
          </p>

          {/* fabric composition */}
          <section className="mt-8 rounded-xl2 border border-border bg-surface p-5">
            <h2 className="mb-4 font-display text-lg font-bold">What it&apos;s made of</h2>
            <CompositionBars parts={product.fabric_composition} />
            <p className="mt-3 text-xs text-muted-foreground">Hover any fibre to learn its impact.</p>
          </section>

          {/* certifications */}
          {s.certifications.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" data-testid="certifications">
              {s.certifications.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium"
                >
                  <BadgeCheck className="size-3.5 text-primary" /> {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* sustainability panel */}
      <section className="mt-10 rounded-xl2 border border-border bg-surface p-6 sm:p-8" data-testid="sustainability-panel">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <ScoreDial score={s.score} grade={s.grade} />
            <p className="max-w-[180px] text-center text-xs text-muted-foreground">
              Scored with a transparent rubric — every point accounted for below.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Why this score?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{s.explanation}</p>

            <div className="mt-5 space-y-2" data-testid="score-factors">
              {s.factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 rounded-lg bg-surface-2 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.detail}</p>
                  </div>
                  <span
                    className={`shrink-0 font-display text-sm font-bold ${
                      f.points >= 0 ? "text-grade-a" : "text-grade-e"
                    }`}
                  >
                    {f.points >= 0 ? "+" : ""}
                    {f.points}
                  </span>
                </div>
              ))}
            </div>

            {s.greenwash_flags.length > 0 && (
              <div className="mt-5 rounded-lg border border-grade-d/40 bg-grade-d/5 p-4" data-testid="greenwash-flags">
                <p className="flex items-center gap-2 text-sm font-semibold text-grade-d">
                  <AlertTriangle className="size-4" /> Claims we couldn&apos;t verify
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                  {s.greenwash_flags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 rounded-lg bg-accent/50 p-4">
              <p className="text-sm font-semibold text-accent-foreground">About {product.brand.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{product.brand.ethics_summary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* similar */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold">Similar, sustainably</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
