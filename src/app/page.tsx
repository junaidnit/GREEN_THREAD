import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { HomeSearch } from "@/components/home-search";
import { CountUp, Marquee, Reveal, RollingWord } from "@/components/kinetic";
import { MATERIAL_LABELS, MATERIAL_SCORES } from "@/lib/scoring";
import { MATERIAL_FACTS } from "@/lib/materials";
import type { MaterialId } from "@/lib/types";
import { ArrowUpRight, Leaf, Sparkles } from "@/components/icons";

export const metadata: Metadata = {
  title: "GreenThread — shop by fabric, not just price",
};

const HERO_WORDS = ["linen", "hemp", "TENCEL", "organic cotton", "merino"];

const FEATURED_FABRICS: Array<{ id: MaterialId; blurb: string }> = [
  { id: "linen", blurb: "low-water flax" },
  { id: "hemp", blurb: "rain-fed" },
  { id: "organic_cotton", blurb: "no pesticides" },
  { id: "tencel_lyocell", blurb: "closed-loop" },
  { id: "recycled_polyester", blurb: "second-life bottles" },
  { id: "merino_wool", blurb: "mulesing-free" },
];

const MARQUEE_FABRICS: MaterialId[] = [
  "linen", "hemp", "organic_cotton", "tencel_lyocell", "recycled_cotton",
  "merino_wool", "cupro", "recycled_polyester", "peace_silk", "modal",
];

export default async function Home() {
  const products = await getCatalog();
  const topPicks = [...products]
    .sort((a, b) => b.sustainability.score - a.sustainability.score)
    .slice(0, 8);
  const brandCount = new Set(products.map((p) => p.brand.slug)).size;
  const fibreCount = new Set(products.flatMap((p) => p.fabric_composition.map((f) => f.material))).size;

  return (
    <div>
      {/* hero — kinetic, ambient, minimal words */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="ambient-blob left-[8%] top-[-60px] size-72 bg-accent" />
        <div aria-hidden className="ambient-blob right-[6%] top-[30%] size-96 bg-primary/15 [animation-delay:-8s]" />
        <div aria-hidden className="ambient-blob bottom-[-80px] left-[35%] size-80 bg-grade-b/20 [animation-delay:-15s]" />

        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Wear more
            <br />
            <RollingWord words={HERO_WORDS} />
          </h1>
          <div className="mt-10">
            <HomeSearch />
          </div>

          {/* stats that count, instead of sentences that explain */}
          <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              { n: products.length, label: "pieces" },
              { n: brandCount, label: "brands" },
              { n: fibreCount, label: "fibres tracked" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.12}>
                <div className="rounded-xl2 border border-border bg-surface/70 py-4 backdrop-blur">
                  <p className="font-display text-3xl font-bold text-primary">
                    <CountUp to={s.n} />
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* fibre marquee — the catalogue whispering past */}
        <Marquee className="border-y border-border bg-surface/60 py-3 backdrop-blur">
          {MARQUEE_FABRICS.map((m) => (
            <Link key={m} href={`/fabric/${m}`} className="group flex shrink-0 items-center gap-2.5">
              <span
                className="size-2 rounded-full"
                style={{
                  background:
                    MATERIAL_SCORES[m] >= 8 ? "var(--grade-a)" : MATERIAL_SCORES[m] >= 6.5 ? "var(--grade-b)" : "var(--grade-c)",
                }}
              />
              <span className="font-display text-sm font-semibold tracking-wide group-hover:text-primary">
                {MATERIAL_LABELS[m]}
              </span>
              <span className="text-xs text-muted-foreground">
                {MATERIAL_FACTS[m]?.stat ?? `${MATERIAL_SCORES[m]}/10`}
              </span>
            </Link>
          ))}
        </Marquee>
      </section>

      {/* fabric tiles — three words max, motion does the talking */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Start with a fabric</h2>
            <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURED_FABRICS.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.06}>
              <Link
                href={`/fabric/${f.id}`}
                data-testid={`home-fabric-${f.id}`}
                className="hover-lift group block rounded-xl2 border border-border bg-surface p-4"
              >
                <Leaf className="size-4 text-primary/60 transition-transform duration-300 group-hover:rotate-12 group-hover:text-primary" />
                <p className="mt-2 font-display font-semibold group-hover:text-primary">{MATERIAL_LABELS[f.id]}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{f.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* top picks */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Highest-scoring right now</h2>
            <Link
              href="/search?sort=score"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              See all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {topPicks.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.07, 0.35)}>
              <ProductCard product={p} priority={i < 4} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* one quiet line about trust — everything else is shown, not told */}
      <Reveal className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <Link
          href="/methodology"
          className="group flex items-center justify-between rounded-xl2 border border-border bg-surface p-6 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <p className="font-display text-lg font-bold">
              Every score, itemised. <span className="text-muted-foreground font-normal">No black box.</span>
            </p>
          </div>
          <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </Reveal>
    </div>
  );
}
