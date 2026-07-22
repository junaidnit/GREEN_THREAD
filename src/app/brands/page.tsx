import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { gradeFor } from "@/lib/scoring";
import { GradeBadge } from "@/components/grade-badge";
import { Reveal } from "@/components/kinetic";

export const metadata: Metadata = {
  title: "Brands, label-checked",
  description:
    "Every brand on The Fibre Set with its fibre record: average score, plastic-free share, and unverified-claim count.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const products = await getCatalog();

  const byBrand = new Map<
    string,
    { name: string; summary: string; count: number; sum: number; flagged: number }
  >();
  for (const p of products) {
    const b =
      byBrand.get(p.brand.slug) ??
      { name: p.brand.name, summary: p.brand.ethics_summary, count: 0, sum: 0, flagged: 0 };
    b.count++;
    b.sum += p.sustainability.score;
    if (p.sustainability.greenwash_flags.length > 0) b.flagged++;
    byBrand.set(p.brand.slug, b);
  }
  const brands = [...byBrand.entries()]
    .map(([slug, b]) => ({ slug, ...b, avg: Math.round(b.sum / b.count) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="eyebrow">The directory</p>
      <h1 className="mt-2 font-serif text-[28px] font-medium italic tracking-tight sm:text-[clamp(2rem,4.6vw,2.5rem)]">
        Brands, label-checked
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Ranked by what their clothes are actually made of — not what the marketing says.
      </p>

      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b, i) => (
          <Reveal key={b.slug} delay={Math.min(i * 0.05, 0.35)}>
            <Link href={`/brand/${b.slug}`} className="group block border-t border-border pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-serif text-[28px] font-medium italic leading-tight group-hover:text-primary">
                  {b.name}
                </p>
                <GradeBadge grade={gradeFor(b.avg)} score={b.avg} />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{b.summary}</p>
              <p className="mt-3 text-[12px] tracking-wide text-muted-foreground">
                {b.count} pieces
                {b.flagged > 0 && (
                  <span className="text-grade-d"> · {b.flagged} unverified claims</span>
                )}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
