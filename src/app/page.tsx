import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { ledgerStats } from "@/lib/truth-server";
import { MATERIAL_LABELS, MATERIAL_NOTES } from "@/lib/scoring";
import { MATERIAL_FACTS } from "@/lib/materials";
import { HeroSearch } from "@/components/hero-search";
import { FibreWidget, type FibreEntry } from "@/components/fibre-widget";
import { garmentType, type GarmentType } from "@/lib/garment";
import type { MaterialId, Product } from "@/lib/types";
import { ArrowUpRight } from "@/components/icons";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* fibres featured in the widget, with a one-line hook + placeholder swatch */
const FIBRES: Array<[MaterialId, string, string]> = [
  ["linen", "cool & breathable", "#aeb0a4"],
  ["organic_cotton", "soft, hypoallergenic", "#c8bcae"],
  ["merino_wool", "regulates heat", "#a58f9c"],
  ["peace_silk", "smoothest, low-friction", "#b8a6a7"],
  ["tencel_lyocell", "cool cellulose", "#b3aeb8"],
  ["hemp", "strongest natural fibre", "#a6a596"],
  ["modal", "beechwood-soft", "#bfb3ab"],
  ["viscose", "fluid & light", "#c2b2a4"],
  ["lambswool", "warm & lofty", "#b0aca0"],
  ["recycled_cotton", "low-impact", "#cabfac"],
];

function firstImage(products: Product[], pred: (p: Product) => boolean): string | null {
  return products.find((p) => pred(p) && p.image_url)?.image_url ?? null;
}
const dominant = (p: Product, m: MaterialId) =>
  [...p.fabric_composition].sort((a, b) => b.pct - a.pct)[0]?.material === m;

/* Picking a photo to represent a FIBRE is not the same as picking a product.
 * Taking the first match gave us a sandal for recycled cotton and a secondhand
 * listing for linen. We rank on garmentType rather than the stored category,
 * because the feed's category is unreliable — a "Macrame Yoga Mat Strap" is
 * filed under shirts. How much cloth each garment shows, roughly: */
const SHOWS_CLOTH: Partial<Record<GarmentType, number>> = {
  dress: 6, jumpsuit: 6, coat: 5, jacket: 5, jumper: 5, cardigan: 5,
  shirt: 5, blouse: 5, skirt: 4, trousers: 4, dungarees: 4, gilet: 4,
  sweatshirt: 3, hoodie: 3, tee: 3, polo: 3, henley: 3, tank: 2, jeans: 2,
};
const SECONDHAND = /pre-?loved|second-?hand/i;
const pctOf = (p: Product, m: MaterialId) =>
  p.fabric_composition.find((f) => f.material === m)?.pct ?? 0;

/**
 * Best photo to represent `m`: dominated by the fibre, an actual garment
 * (not homeware or an accessory), new rather than secondhand, and as pure as
 * possible. Deterministic — ties break on id so the homepage doesn't reshuffle
 * between builds.
 */
function fibreImage(products: Product[], m: MaterialId): string | null {
  const scored = products
    .filter((p) => p.image_url && dominant(p, m) && !SECONDHAND.test(p.title))
    .map((p) => ({ p, cloth: SHOWS_CLOTH[garmentType(p.title)] ?? 0 }))
    .filter((c) => c.cloth > 0)
    .map((c) => ({ ...c, score: c.cloth * 100 + pctOf(c.p, m) }))
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));
  return scored[0]?.p.image_url ?? null;
}

const CHILDRENS = /\b(baby|babies|kids?|child|children|infant|toddler)\b/i;
const HOMEWARE = /\b(cushion|blanket|bedding|duvet|sheet|pillow|towel|napkin|apron|throw)\b/i;

export default async function Home() {
  const products = await getCatalog();
  const stats = ledgerStats();

  const heroImg = firstImage(products, (p) => /dress|linen/i.test(p.title) && p.gender === "women") ?? products[0]?.image_url ?? null;
  const womenImg = firstImage(products, (p) => p.gender === "women" && /dress|linen/i.test(p.title)) ?? firstImage(products, (p) => p.gender === "women");
  const menImg = firstImage(products, (p) => p.gender === "men");

  const childrenImg = firstImage(products, (p) => CHILDRENS.test(p.title));
  const homeImg = firstImage(products, (p) => HOMEWARE.test(p.title) && !CHILDRENS.test(p.title));

  // a fibre with no photo that genuinely shows it is dropped rather than
  // rendered as an empty tile — we stock no silk, so silk would sit blank
  const fibres: FibreEntry[] = FIBRES.filter(([id]) => MATERIAL_FACTS[id])
    .map(([id, tagline, swatch]) => {
      const f = MATERIAL_FACTS[id]!;
      return {
        id, tagline, swatch,
        label: MATERIAL_LABELS[id],
        note: MATERIAL_NOTES[id],
        stat: f.stat, detail: f.detail, source: f.source,
        image: fibreImage(products, id),
      };
    })
    .filter((f) => f.image);

  const fibreCount = new Set(products.flatMap((p) => p.fabric_composition.map((f) => f.material))).size;
  const brandCount = new Set(products.map((p) => p.brand.slug)).size;

  const articles = [
    { eyebrow: "Sensitive skin", title: "The fibres that calm reactive, eczema-prone skin", blurb: "Why smooth, low-friction silk and long-staple organic cotton settle skin that reacts to everything else.", href: "/condition/eczema", img: firstImage(products, (p) => dominant(p, "peace_silk")) ?? womenImg },
    { eyebrow: "Menopause", title: "Dressing for the 3am flash — fibres that help", blurb: "How merino, linen and TENCEL move with a temperature surge, and the 'cooling' synthetics worth avoiding.", href: "/search?fabric=merino_wool", img: firstImage(products, (p) => dominant(p, "merino_wool")) ?? menImg },
    { eyebrow: "Breathability", title: "Why linen earns its place against hot skin", blurb: "Hollow flax fibres and an open weave move heat away — the plain case for linen in summer and in bed.", href: "/fabric/linen", img: firstImage(products, (p) => dominant(p, "linen")) ?? heroImg },
    { eyebrow: "Non-toxic living", title: "What actually sheds onto your skin", blurb: "The plain version of the microplastics question — and the natural fibres that shed nothing at all.", href: "/label-watch", img: firstImage(products, (p) => dominant(p, "organic_cotton")) ?? womenImg },
  ];

  return (
    <div>
      {/* ── HERO ── */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1280px] items-stretch gap-0 md:grid-cols-[1.02fr_.98fr]">
          <div className="flex flex-col justify-center gap-6 px-6 py-16 sm:px-10 md:py-24">
            <span className="eyebrow">Natural fibres, chosen well</span>
            <h1 className="max-w-[15ch] font-display text-[clamp(2rem,4.6vw,2.5rem)] leading-[1.12] text-foreground sm:text-[clamp(2rem,4.6vw,2.5rem)]">
              Clothes and bedding chosen for the skin they sit against.
            </h1>
            <p className="max-w-[46ch] text-[16px] font-light leading-relaxed text-muted-foreground">
              We&apos;ve read the composition on {products.length.toLocaleString("en-GB")} pieces from {brandCount} brands —
              every percentage here is the brand&apos;s own disclosure, not our estimate. Search a fibre,
              or paste a link from any other shop and we&apos;ll read that one too.
            </p>
            <HeroSearch />
          </div>
          <div className="relative min-h-[360px] bg-surface-2 md:min-h-full">
            {heroImg && <Image src={heroImg} alt="Natural-fibre clothing" fill sizes="(max-width:768px) 100vw, 50vw" priority className="object-cover" />}
          </div>
        </div>
      </section>

      {/* ── EXTENSION CTA (prominent, near top) ── */}
      <section className="bg-foreground text-background">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 px-6 py-10 sm:px-10 md:flex-row">
          <div className="text-center md:text-left">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-rose">The free tool</span>
            <h2 className="mt-2 font-display text-[28px] text-background">Check any fabric label, on any shop.</h2>
            <p className="mt-2 max-w-[52ch] text-[16px] font-light leading-relaxed opacity-75">
              Reads the fibre composition on any retailer&apos;s product page — Zara, ASOS, M&amp;S — so the
              plastic hiding in a &ldquo;linen&rdquo; blend shows up before you buy. Free, and it can only see a
              page in the moment you click it.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link href="/extension" className="rounded-full bg-primary px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90">
              Install the extension
            </Link>
            <Link href="/analyze" className="rounded-full border border-background/30 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-background/10">
              Try it here
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PANELS ── */}
      <section className="mx-auto max-w-[1280px] px-6 section-y sm:px-10">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="eyebrow">Shop by</span>
            <h2 className="mt-2 font-display text-[28px] text-foreground">Four ways in</h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <CategoryPanel href="/search?gender=women" label="Women" img={womenImg} />
          <CategoryPanel href="/search?gender=men" label="Men" img={menImg} />
          <CategoryPanel href="/children" label="Children" img={childrenImg} soon swatch="#c8bcae" note="The little-skin edit" />
          <CategoryPanel href="/home" label="Home & Bedding" img={homeImg} soon swatch="#9a8fa0" note="Linen, hemp & wool for sleep" />
        </div>
      </section>

      {/* ── FIBRE WIDGET ── */}
      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-[1280px] px-6 section-y sm:px-10">
          <div className="mb-12 max-w-[52ch]">
            <span className="eyebrow">The materials</span>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-foreground">
              Every fibre, and what it actually does for your skin.
            </h2>
            <p className="mt-3 text-[16px] font-light leading-relaxed text-muted-foreground">
              How each one feels, wears and behaves against skin — including where it fails. Wool is
              warm and breathable and still irritates eczema; we say so on the wool page.
            </p>
          </div>
          <FibreWidget fibres={fibres} />
        </div>
      </section>

      {/* ── ARTICLES / MAGAZINE CAROUSEL ── */}
      <section className="mx-auto max-w-[1280px] px-6 section-y sm:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="eyebrow">The Journal</span>
            <h2 className="mt-2 font-display text-[28px] text-foreground">Reading, close to the skin</h2>
          </div>
          <Link href="/journal" className="border-b border-slate pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate hover:text-primary">
            All articles
          </Link>
        </div>
        <div className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 sm:-mx-10 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {articles.map((a) => (
            <Link key={a.href + a.title} href={a.href} className="group w-[300px] shrink-0 snap-start sm:w-[340px]">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                {a.img && <Image src={a.img} alt={a.title} fill sizes="340px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
              </div>
              <span className="eyebrow mt-4 block">{a.eyebrow}</span>
              <h3 className="mt-2 font-display text-[20px] leading-snug text-foreground group-hover:text-primary">{a.title}</h3>
              <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">{a.blurb}</p>
              <span className="mt-3 inline-block text-[12px] font-semibold uppercase tracking-[0.13em] text-slate">Read →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── STAT BAND ── */}
      <section className="border-y border-border bg-foreground text-background">
        <div className="mx-auto max-w-[1280px] px-6 section-y sm:px-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              [products.length.toLocaleString("en-GB"), "real pieces, label-read"],
              [String(fibreCount), "natural & plant fibres"],
              [String(brandCount), "brands read in full"],
              [stats ? String(stats.flagged) : "—", "greenwash flags on record"],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="font-display text-[clamp(2rem,4.6vw,2.5rem)] font-light tabular-nums">{n}</p>
                <p className="mt-1 text-[12px] font-light uppercase tracking-[0.1em] opacity-70">{l}</p>
              </div>
            ))}
          </div>
          {/* Dating the claim is what makes it quotable. An undated "we read
              every label" is marketing; a counted, dated figure is a source. */}
          {stats && (
            <p className="mt-8 text-center text-[14px] font-light opacity-75">
              Counted from our public record on{" "}
              <time dateTime={new Date().toISOString().slice(0, 10)}>
                {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              , kept since{" "}
              {new Date(stats.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.{" "}
              <Link href="/label-watch" className="underline underline-offset-2">
                See what we flagged
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* ── INSTAGRAM / SOCIAL (stub) ── */}
      <section className="mx-auto max-w-[1280px] px-6 section-y text-center sm:px-10">
        <span className="eyebrow">Follow along</span>
        <h2 className="mt-2 font-display text-[28px] text-foreground">@thefibreset</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[womenImg, menImg, heroImg, fibres[0]?.image].map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden bg-surface-2">
              {img && <Image src={img} alt="A natural-fibre piece from The Fibre Set" fill sizes="300px" className="object-cover transition-transform duration-700 hover:scale-105" />}
            </div>
          ))}
        </div>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="mt-8 inline-block border-b border-slate pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate hover:text-primary">
          Follow on Instagram →
        </a>
      </section>
    </div>
  );
}

function CategoryPanel({
  href, label, img, soon, swatch, note,
}: {
  href: string; label: string; img?: string | null; soon?: boolean; swatch?: string; note?: string;
}) {
  return (
    <Link href={href} className="group relative block aspect-[16/11] overflow-hidden">
      <div className="absolute inset-0 bg-surface-2" style={swatch ? { background: swatch } : undefined}>
        {img && <Image src={img} alt={label} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(58,58,85,.6), rgba(58,58,85,0) 55%)" }} />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-7 text-background">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] opacity-90">{soon ? "Coming soon" : "Shop"}</span>
          <h3 className="font-display text-[28px] text-background">{label}</h3>
          {note && <p className="mt-0.5 text-[14px] font-light opacity-85">{note}</p>}
        </div>
        <ArrowUpRight className="size-5 opacity-80 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
