import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { GradeBadge } from "@/components/grade-badge";
import { BadgeCheck, Leaf } from "@/components/icons";
import { CERT_INFO } from "@/lib/materials";
import { gradeFor } from "@/lib/scoring";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getCatalog();
  return [...new Set(products.map((p) => p.brand.slug))].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = (await getCatalog()).filter((p) => p.brand.slug === slug);
  if (products.length === 0) return {};
  const b = products[0].brand;
  return {
    title: `${b.name} — sustainability profile & products | GreenThread`,
    description: b.ethics_summary,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const all = await getCatalog();
  const products = all
    .filter((p) => p.brand.slug === slug)
    .sort((a, b) => b.sustainability.score - a.sustainability.score);
  if (products.length === 0) notFound();
  const brand = products[0].brand;

  const avg = Math.round(products.reduce((s, p) => s + p.sustainability.score, 0) / products.length);
  const flagged = products.filter((p) => p.sustainability.greenwash_flags.length > 0).length;
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-xl2 border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold">{brand.name}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{brand.ethics_summary}</p>
            {brand.certifications.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {brand.certifications.map((c) => (
                  <span key={c} title={CERT_INFO[c]} className="flex cursor-help items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium">
                    <BadgeCheck className="size-3.5 text-primary" /> {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-xl2 bg-surface-2 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Catalog average</p>
              <p className="font-display text-2xl font-bold">{avg}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
            </div>
            <GradeBadge grade={gradeFor(avg)} size="lg" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span><b className="text-foreground">{products.length}</b> items on GreenThread</span>
          <span><b className="text-foreground">{categories.length}</b> categories</span>
          {flagged > 0 && (
            <span className="text-grade-d"><b>{flagged}</b> items carry unverified eco-claims</span>
          )}
          <Link href="/methodology" className="flex items-center gap-1 text-primary hover:underline">
            <Leaf className="size-3" /> how scoring works
          </Link>
        </div>
      </div>

      <div className="mb-4 mt-8 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold">Everything from {brand.name}</h2>
        <Link href={`/search?brand=${slug}`} className="text-sm font-medium text-primary hover:underline">
          Filter & refine →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {products.slice(0, 24).map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
      {products.length > 24 && (
        <div className="mt-6 text-center">
          <Link
            href={`/search?brand=${slug}`}
            className="inline-block rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium hover:bg-surface-2"
          >
            See all {products.length} items
          </Link>
        </div>
      )}
    </div>
  );
}
