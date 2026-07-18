import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { LabelHero } from "@/components/label-hero";
import { Marquee, Reveal } from "@/components/kinetic";
import { MATERIAL_LABELS, MATERIAL_SCORES } from "@/lib/scoring";
import { MATERIAL_FACTS } from "@/lib/materials";
import type { MaterialId } from "@/lib/types";
import { ArrowUpRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "GreenThread — shop by fabric, not just price",
};

const MARQUEE_FABRICS: MaterialId[] = [
  "linen", "hemp", "organic_cotton", "tencel_lyocell", "recycled_cotton",
  "merino_wool", "cupro", "recycled_polyester", "peace_silk", "modal",
];

export default async function Home() {
  const products = await getCatalog();
  const topPicks = [...products]
    .sort((a, b) => b.sustainability.score - a.sustainability.score)
    .slice(0, 9);
  const brandCount = new Set(products.map((p) => p.brand.slug)).size;
  const fibreCount = new Set(products.flatMap((p) => p.fabric_composition.map((f) => f.material))).size;
  const campaign = topPicks[0];

  // brand gallery aggregates, best average first
  const byBrand = new Map<string, { name: string; count: number; sum: number }>();
  for (const p of products) {
    const b = byBrand.get(p.brand.slug) ?? { name: p.brand.name, count: 0, sum: 0 };
    b.count++;
    b.sum += p.sustainability.score;
    byBrand.set(p.brand.slug, b);
  }
  const brandTiles = [...byBrand.entries()]
    .map(([slug, b]) => ({ slug, name: b.name, count: b.count, avg: Math.round(b.sum / b.count) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div>
      {/* ── Phia-style label-truth hero ── */}
      <LabelHero pieces={products.length} brands={brandCount} fibres={fibreCount} />

      {/* ── fibre marquee ── */}
      <Marquee className="border-y border-border py-3.5">
        {MARQUEE_FABRICS.map((m) => (
          <Link key={m} href={`/fabric/${m}`} className="group flex shrink-0 items-center gap-2.5">
            <span
              className="size-1.5 rounded-full"
              style={{ background: MATERIAL_SCORES[m] >= 8 ? "var(--grade-a)" : MATERIAL_SCORES[m] >= 6.5 ? "var(--grade-b)" : "var(--grade-c)" }}
            />
            <span className="font-display text-sm font-semibold uppercase tracking-wide group-hover:text-primary">
              {MATERIAL_LABELS[m]}
            </span>
            <span className="text-xs text-muted-foreground">{MATERIAL_FACTS[m]?.stat ?? `${MATERIAL_SCORES[m]}/10`}</span>
          </Link>
        ))}
      </Marquee>

      {/* ── the edits: specific fibres only (Phia editorial-tile pattern) ── */}
      <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">The edits</p>
              <h2 className="mt-1 font-serif text-3xl font-medium italic tracking-tight sm:text-4xl">
                One fibre at a time
              </h2>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "The Linen Edit", href: "/fabric/linen", img: "photo-1602810318383-e386cc2a3ccf", note: "cool, low-water, timeless" },
            { title: "The Hemp Edit", href: "/fabric/hemp", img: "photo-1591195853828-11db59a44f6b", note: "rain-fed, built for decades" },
            { title: "The Wool Edit", href: "/fabric/merino_wool", img: "photo-1434389677669-e08b4cac3105", note: "warm, renewable, alive" },
          ].map((e, i) => (
            <Reveal key={e.href} delay={i * 0.08}>
              <Link
                href={e.href}
                data-testid={`edit-tile-${i}`}
                className="group relative block aspect-[3/4] overflow-hidden"
              >
                <Image
                  src={`https://images.unsplash.com/${e.img}?auto=format&fit=crop&w=800&h=1100&q=80`}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="font-serif text-3xl font-medium italic leading-tight">{e.title}</p>
                  <p className="mt-1 text-xs text-white/75">{e.note}</p>
                  <p className="mt-3 text-sm font-medium underline decoration-white/50 underline-offset-4 transition-colors group-hover:decoration-white">
                    Start exploring →
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── the brand gallery: bright desire (Phia pattern) ── */}
      <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">The directory</p>
              <h2 className="mt-1 font-serif text-3xl font-medium italic tracking-tight sm:text-4xl">
                Brands, label-checked
              </h2>
            </div>
            <Link href="/brands" className="eyebrow flex items-center gap-1 hover:text-primary">
              All brands <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {brandTiles.map((b, i) => (
            <Reveal key={b.slug} delay={Math.min(i * 0.05, 0.3)}>
              <Link
                href={`/brand/${b.slug}`}
                data-testid={`brand-tile-${b.slug}`}
                className="hover-lift group block border border-border bg-surface p-5 text-center"
              >
                <p className="font-serif text-lg font-medium italic leading-tight group-hover:text-primary">
                  {b.name}
                </p>
                <p className="mt-2 text-[11px] tracking-wide text-muted-foreground">
                  {b.count} pieces · avg {b.avg}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── editorial top picks ── */}
      <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">The index</p>
              <h2 className="mt-1 font-serif text-3xl font-medium italic tracking-tight sm:text-4xl">
                Highest scoring
              </h2>
            </div>
            <Link href="/search?sort=score" className="eyebrow flex items-center gap-1 hover:text-primary">
              All <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3">
          {topPicks.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.06, 0.4)}>
              <ProductCard product={p} priority={i < 3} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── full-bleed campaign moment: the making, on film ── */}
      {campaign && (
        <Reveal className="mt-20">
          <Link href="/search" className="group relative block h-[70vh] overflow-hidden bg-[#0c0f0d]">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&h=900&q=70"
            >
              <source src="https://videos.pexels.com/video-files/6653414/6653414-sd_960_506_25fps.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
              <p className="eyebrow !text-white/80">Every fibre, scored</p>
              <p className="mt-3 max-w-2xl px-6 font-serif text-4xl font-medium italic leading-tight sm:text-6xl">
                Beautiful clothes, nothing to hide
              </p>
              <span className="mt-6 flex items-center gap-2 rounded-full border border-white/40 px-6 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-black">
                Explore the edit <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      {/* ── quiet trust line ── */}
      <Reveal className="mx-auto my-20 max-w-7xl px-5 sm:px-8">
        <Link
          href="/methodology"
          className="group flex items-center justify-between border-t border-border pt-6"
        >
          <p className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Every score, itemised. <span className="font-normal text-muted-foreground">No black box.</span>
          </p>
          <ArrowUpRight className="size-6 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </Reveal>
    </div>
  );
}
