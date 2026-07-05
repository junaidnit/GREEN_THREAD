import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { HomeSearch } from "@/components/home-search";
import { CountUp, Marquee, Reveal, RollingWord } from "@/components/kinetic";
import { MATERIAL_LABELS, MATERIAL_SCORES } from "@/lib/scoring";
import { MATERIAL_FACTS } from "@/lib/materials";
import type { MaterialId } from "@/lib/types";
import { ArrowUpRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "GreenThread — shop by fabric, not just price",
};

const HERO_WORDS = ["linen", "hemp", "TENCEL", "organic cotton", "merino"];
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1400&h=1800&q=85";

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

  return (
    <div>
      {/* ── cinematic split hero ── */}
      <section className="grid items-stretch lg:min-h-[86vh] lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col justify-center px-5 py-16 sm:px-10 lg:px-16">
          <p className="eyebrow">Sustainable fashion, decoded</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
            Wear more
            <br />
            <RollingWord words={HERO_WORDS} />
          </h1>
          <div className="mt-9 max-w-md">
            <HomeSearch />
          </div>
          <div className="mt-9 flex gap-8">
            {[
              { n: products.length, label: "pieces" },
              { n: brandCount, label: "brands" },
              { n: fibreCount, label: "fibres" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold">
                  <CountUp to={s.n} />
                </p>
                <p className="eyebrow mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[60vh] overflow-hidden lg:min-h-full">
          <Image src={HERO_IMAGE} alt="" fill priority sizes="50vw" className="kenburns object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-background lg:via-transparent lg:to-transparent" />
        </div>
      </section>

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

      {/* ── editorial top picks ── */}
      <section className="mx-auto mt-14 max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">The index</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Highest scoring</h2>
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

      {/* ── full-bleed campaign moment ── */}
      {campaign && (
        <Reveal className="mt-20">
          <Link href="/search" className="group relative block h-[70vh] overflow-hidden">
            <Image
              src={campaign.image_url.replace(/w=900/, "w=1800").replace(/h=1200/, "h=1400")}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
              <p className="eyebrow !text-white/80">Every fibre, scored</p>
              <p className="mt-3 max-w-2xl px-6 font-display text-4xl font-bold leading-tight sm:text-6xl">
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
