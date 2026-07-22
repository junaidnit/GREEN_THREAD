import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopCatalog } from "@/lib/catalog";
import { CONDITIONS, CONDITION_SLUGS, isConditionSafe, type ConditionSlug } from "@/lib/conditions";
import { ProductCard } from "@/components/product-card";
import { AlertTriangle, BadgeCheck } from "@/components/icons";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CONDITION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!CONDITION_SLUGS.includes(slug as ConditionSlug)) return {};
  const rule = CONDITIONS[slug as ConditionSlug];
  return {
    title: `${rule.name} clothing: every label checked`,
    description: rule.summary,
    alternates: { canonical: `/condition/${slug}` },
  };
}

export default async function ConditionPage({ params }: Props) {
  const { slug } = await params;
  if (!CONDITION_SLUGS.includes(slug as ConditionSlug)) notFound();
  const rule = CONDITIONS[slug as ConditionSlug];

  const all = await getShopCatalog();
  const products = all
    .filter((p) => isConditionSafe(p.fabric_composition, rule.slug))
    .sort((a, b) => b.sustainability.score - a.sustainability.score);

  const excludedLabels = [...new Set(rule.excludes.map((e) => e.material))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-xl2 border border-primary/25 bg-accent/40 p-6 sm:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <BadgeCheck className="size-3.5 text-primary" /> {rule.clinicalName}
        </p>
        <h1 className="font-serif text-[28px] font-medium italic tracking-tight sm:text-[clamp(2rem,4.6vw,2.5rem)]">{rule.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{rule.summary}</p>

        <ul className="mt-5 space-y-2">
          {rule.guidance.map((g) => (
            <li key={g} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              {g}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {excludedLabels.map((m) => {
            const entry = rule.excludes.find((e) => e.material === m)!;
            return (
              <span
                key={m}
                title={entry.reason}
                className="inline-flex items-center gap-1 rounded-full bg-grade-d/10 px-2.5 py-1 text-[12px] font-medium text-grade-d"
              >
                <AlertTriangle className="size-3" /> excludes {m.replace(/_/g, " ")}
              </span>
            );
          })}
        </div>

        <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
          <b>Sources: </b>
          {rule.sources.map((s, i) => (
            <span key={s.label}>
              {i > 0 && "; "}
              {s.label} ({s.note})
            </span>
          ))}
          .
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          <b>This is general information, not medical advice.</b> We filter by disclosed fibre
          composition only, we can&apos;t see dye or finish chemistry, and everyone&apos;s skin is
          different. If you have a diagnosed condition or allergy, please check with your
          dermatologist or GP, especially before switching fabrics for a first time.
        </p>
      </div>

      <div className="mb-4 mt-8 flex items-end justify-between gap-4">
        <h2 className="font-display text-[20px] font-bold">{products.length} pieces that qualify</h2>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_SLUGS.filter((s) => s !== rule.slug).map((s) => (
            <Link
              key={s}
              href={`/condition/${s}`}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {CONDITIONS[s].name} →
            </Link>
          ))}
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {products.slice(0, 48).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No products currently meet this list, check back soon.</p>
      )}
    </div>
  );
}
