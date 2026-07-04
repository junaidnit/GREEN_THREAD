import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { HomeSearch } from "@/components/home-search";
import { MATERIAL_LABELS } from "@/lib/scoring";
import type { MaterialId } from "@/lib/types";
import { ArrowUpRight, BadgeCheck, Leaf, Sparkles } from "@/components/icons";

export const metadata: Metadata = {
  title: "GreenThread — shop by fabric, not just price",
};

const FEATURED_FABRICS: Array<{ id: MaterialId; blurb: string }> = [
  { id: "linen", blurb: "Low-water flax, made for heat" },
  { id: "hemp", blurb: "Rain-fed, pesticide-free" },
  { id: "organic_cotton", blurb: "No synthetic pesticides" },
  { id: "tencel_lyocell", blurb: "Closed-loop wood fibre" },
  { id: "recycled_polyester", blurb: "Bottles, given a second life" },
  { id: "merino_wool", blurb: "Certified, mulesing-free" },
];

export default async function Home() {
  const products = await getCatalog();
  const topPicks = [...products]
    .sort((a, b) => b.sustainability.score - a.sustainability.score)
    .slice(0, 8);

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent),transparent_70%)] opacity-60"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Leaf className="size-3.5 text-primary" />
            One search, every sustainable wardrobe staple
          </p>
          <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Shop by <span className="text-primary">fabric</span>,
            <br /> not just price.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
            Search clothing across retailers, filter by what it&apos;s actually made of,
            and see an explainable sustainability score on every garment.
          </p>
          <div className="mt-8">
            <HomeSearch />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-primary" /> Full fabric composition
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" /> AI-enriched catalog
            </span>
            <span className="flex items-center gap-1.5">
              <Leaf className="size-4 text-primary" /> Transparent scoring — tap any score
            </span>
          </div>
        </div>
      </section>

      {/* fabric categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Start with a fabric</h2>
          <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Browse all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURED_FABRICS.map((f) => (
            <Link
              key={f.id}
              href={`/fabric/${f.id}`}
              data-testid={`home-fabric-${f.id}`}
              className="hover-lift group rounded-xl2 border border-border bg-surface p-4"
            >
              <p className="font-display font-semibold group-hover:text-primary">{MATERIAL_LABELS[f.id]}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* top picks */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">Highest-scoring right now</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked by our transparent rubric — fibres, certifications and brand practices.
            </p>
          </div>
          <Link
            href="/search?sort=score"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            See all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {topPicks.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </section>
    </div>
  );
}
