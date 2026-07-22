import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalog, getProduct, getShopCatalog } from "@/lib/catalog";
import { getSameButBetter, getSameLook } from "@/lib/twins";
import { garmentLabel } from "@/lib/garment";
import { truthRecordFor } from "@/lib/truth-server";
import { BuyButton } from "@/components/buy-button";
import { RESALE_PLATFORMS, resaleTerm } from "@/lib/resale-links";
import { formatPrice, titleCase } from "@/lib/format";
import { ProductJsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/site";
import { MATERIAL_LABELS } from "@/lib/scoring";
import {
  CERT_INFO,
  estimatedWears,
  fibreMark,
  impactEquivalents,
  misleadingName,
  naturalPct,
  sheddingRisk,
} from "@/lib/materials";
import { ProductCard } from "@/components/product-card";
import { FibreProfile } from "@/components/fibre-profile";
import { AskConcierge } from "@/components/ask-concierge";
import { FabricLens } from "@/components/fabric-lens";
import { SaveButton } from "@/components/saved";
import { spreadByImage } from "@/lib/spread";
import { ExpandableText } from "@/components/kinetic";
import { AlertTriangle, ArrowUpRight, BadgeCheck, Leaf, Sparkles } from "@/components/icons";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  // Pre-render only the top-scoring pages at build time; the other ~1,600
  // render on first request (and are then cached). Keeps builds fast.
  const products = await getCatalog();
  return [...products]
    .sort((a, b) => b.sustainability.score - a.sustainability.score)
    .slice(0, 32)
    .map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return {};
  return {
    title: `${product.title}: ${product.brand.name}`,
    description: product.sustainability.explanation,
    openGraph: {
      title: `${product.title}: what it is made of`,
      description: product.sustainability.explanation,
      images: [{ url: product.image_url }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const s = product.sustainability;

  // Everything we RECOMMEND comes from the shoppable set, so a page for a
  // plastic garment (reachable from Label Watch) can still point at natural
  // alternatives without ever suggesting another plastic one.
  const all = await getShopCatalog();

  // same garment type, same design, same wearer, never a fallback to
  // "anything in this category", which is how a polo got shown a camisole
  const similar = getSameLook(product, all);
  const peers = all.filter((p) => p.category === product.category);
  const catAvg = Math.round(peers.reduce((sum, p) => sum + p.sustainability.score, 0) / peers.length);
  const delta = s.score - catAvg;

  // "same style, greener", the best similar item that meaningfully beats this one
  const greener = similar.find((p) => p.sustainability.score >= s.score + 10);

  const impacts = impactEquivalents(product.category, product.fabric_composition);
  const wears = estimatedWears(product.fabric_composition);
  const sheds = sheddingRisk(product.fabric_composition);
  const mark = fibreMark(product.fabric_composition);
  const misnamed = misleadingName(product.title, product.fabric_composition);
  const natural = naturalPct(product.fabric_composition);
  // THE promise: this exact garment, in a better fabric
  const { matches: betterMatches, reason: noMatchReason } = getSameButBetter(product, all);
  const noun = garmentLabel(product.title, product.category); // "polo", "dress", …
  const truth = truthRecordFor(product.id);
  const secondhandTerm = resaleTerm(product.brand.name, product.title);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProductJsonLd
        id={product.id}
        name={product.title}
        brand={product.brand.name}
        image={product.image_url}
        price={product.price}
        currency={product.currency}
        url={`${SITE_URL}/product/${product.id}`}
        description={product.description}
        materials={product.fabric_composition.map((f) => ({
          label: MATERIAL_LABELS[f.material] ?? f.material,
          pct: f.pct,
        }))}
      />
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
        {/* image, hover to inspect the weave; morphs in from the grid card */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-xl2 border border-border bg-surface-2"
          style={{ viewTransitionName: `pimg-${product.id.replace(/[^a-zA-Z0-9-]/g, "")}` }}
        >
          <FabricLens imageUrl={product.image_url}>
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </FabricLens>
          <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-surface/85 px-2.5 py-1 text-[12px] font-medium text-muted-foreground backdrop-blur">
            hover to inspect the weave
          </p>
        </div>

        {/* info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {product.retailer === product.brand.name
                ? product.brand.name
                : `${product.brand.name} · sold by ${product.retailer}`}
            </p>
            {product.source === "live" && (
              <span
                data-testid="live-badge"
                className="inline-flex items-center gap-1 rounded-full bg-grade-a/10 px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-grade-a"
                title={`Real listing, details verified from ${product.brand.name}'s own product page`}
              >
                <span className="size-1.5 animate-pulse rounded-full bg-grade-a" />
                Live listing
              </span>
            )}
          </div>
          <h1 className="mt-1 font-serif text-[28px] font-medium leading-tight tracking-tight sm:text-[28px]">
            {product.title}
          </h1>
          <p className="mt-3 font-display text-[28px] font-semibold" data-testid="product-price">
            {formatPrice(product.price, product.currency)}
          </p>

          {/* sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-5" data-testid="product-sizes">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Available sizes · {product.fit} fit
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:max-w-sm">
            <BuyButton
              id={product.id}
              title={product.title}
              brand={product.brand.name}
              price={product.price}
              plastic={mark.plastic}
              natural={natural}
              retailer={product.retailer}
            />
            <div className="flex gap-2">
              {/* every product is a real listing, deep-link to the exact item */}
              <a
                href={product.buy_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-testid="view-on-retailer"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
              >
                View this exact item at {product.brand.name} <ArrowUpRight className="size-3.5" />
              </a>
              <SaveButton productId={product.id} imageUrl={product.image_url} />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Buy opens this exact product on {product.retailer}&apos;s own site, composition verified from their page.
          </p>

          {/* tangible impact + longevity */}
          {(impacts.length > 0 || wears >= 100 || sheds) && (
            <div className="mt-5 space-y-2" data-testid="impact-equivalents">
              {impacts.map((imp, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-accent/40 px-3.5 py-2.5">
                  <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-accent-foreground">{imp.headline}</p>
                    <p className="text-[12px] text-muted-foreground">{imp.detail}</p>
                  </div>
                </div>
              ))}
              {wears >= 100 && (
                <p className="px-1 text-xs text-muted-foreground">
                  Built to last ≈ <b className="text-foreground">{wears} wears</b>, that&apos;s
                  about <b className="text-foreground">{formatPrice(Math.max(0.2, product.price / wears), product.currency).replace(/^£/, "£")}</b>{" "}
                  per wear if you keep it in rotation.
                </p>
              )}
              {sheds && (
                <p className="px-1 text-xs text-muted-foreground">
                  ⚠ Mostly synthetic, sheds microfibres in the wash. A filter bag (e.g.
                  Guppyfriend) catches most of them.
                </p>
              )}
            </div>
          )}

          {/* fabric composition, the platform's core promise */}
          <section className="mt-8 rounded-xl2 border border-border bg-surface p-5" data-testid="composition-section">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-[20px] font-bold">What it&apos;s made of</h2>
              <span
                data-testid="pdp-fibre-mark"
                className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                  mark.tone === "natural" ? "bg-grade-a" : mark.tone === "plastic-free" ? "bg-grade-b" : "bg-grade-d"
                }`}
              >
                {mark.tone === "plastic" ? `${natural}% natural · ${mark.plastic}% plastic` : mark.label}
              </span>
            </div>
            {misnamed && (
              <div
                data-testid="misnamed-warning"
                className="mb-4 rounded-lg border border-grade-d/40 bg-grade-d/10 px-3.5 py-2.5 text-sm"
              >
                <b className="text-grade-d">Label check:</b> named after {misnamed.fibre}, but it&apos;s
                only <b>{misnamed.actualPct}% {misnamed.fibre}</b>.
              </div>
            )}
            <FibreProfile parts={product.fabric_composition} />

            {/* the truth ledger: our independent, timestamped record */}
            {truth && (
              <div className="mt-4 border-t border-border pt-3" data-testid="truth-record">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3.5 text-grade-a" />
                  On The Fibre Set&apos;s independent record since{" "}
                  <time dateTime={truth.trackedSince} className="font-medium text-foreground">
                    {new Date(truth.trackedSince).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </time>
                  {" · "}
                  {truth.history.length} verified {truth.history.length === 1 ? "reading" : "readings"}
                </p>
                {truth.changed && (
                  <p className="mt-1.5 text-xs font-medium text-grade-d">
                    ⚠ This item&apos;s composition or score has changed since we first logged it, we keep the full history.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* certifications, hover any badge to learn what it actually verifies */}
          {s.certifications.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" data-testid="certifications">
              {[...new Set(s.certifications)].map((c) => (
                <span key={c} className="group relative">
                  <span className="flex cursor-help items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium">
                    <BadgeCheck className="size-3.5 text-primary" /> {c}
                  </span>
                  {CERT_INFO[c] && (
                    <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground shadow-xl group-hover:block">
                      {CERT_INFO[c]}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {product.source === "extracted" && (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground" title="Fabric composition was extracted from the product's own label text by our AI pipeline, then validated against a certification evidence check.">
              <Sparkles className="size-3 text-primary" /> Composition read from the label by our
              extraction pipeline
            </p>
          )}
        </div>
      </div>

      {/* What it is made of.
          This replaced a 0-100 score and an A-E grade. We are not an
          accredited ratings body, and a letter grade borrows an authority we
          have not earned: it compresses a judgement we invented into something
          that looks certified. The composition is not a judgement, it is what
          the brand discloses, drawn in proportion. */}
      <section className="mt-10 rounded-xl2 border border-border bg-surface p-6 sm:p-8" data-testid="sustainability-panel">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <h2 className="font-display text-[20px] font-bold">What it is made of</h2>
            <div className="mt-4">
              <FibreProfile parts={product.fabric_composition} />
            </div>
            <Link
              href="/methodology"
              className="mt-5 inline-block text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              How we read a label →
            </Link>
          </div>
          <div>
            <h2 className="font-display text-[20px] font-bold">What that means to wear</h2>
            <ExpandableText text={s.explanation} className="mt-2 max-w-2xl" />

            {greener && (
              <Link
                href={`/product/${greener.id}`}
                data-testid="greener-nudge"
                className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-grade-a/40 bg-grade-a/5 px-4 py-3 transition-colors hover:bg-grade-a/10"
              >
                <span className="text-sm">
                  <b className="text-grade-a">The same style, in a better fibre:</b> {greener.title} at{" "}
                  {formatPrice(greener.price, greener.currency)}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-grade-a" />
              </Link>
            )}

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

            <AskConcierge
              question={`Tell me more about the ${product.title} by ${product.brand.name}, is it a good sustainable choice, and are there better alternatives?`}
            />
          </div>
        </div>
      </section>


      {/* THE promise: this exact garment, in a better fabric */}
      {betterMatches.length > 0 && (
        <section className="mt-12" data-testid="better-fibre">
          <p className="eyebrow">The same {noun}, better fabric</p>
          <h2 className="mb-1 mt-1 font-serif text-[28px] font-medium italic tracking-tight sm:text-[28px]">
            {betterMatches[0].tier === "exact"
              ? `This ${noun}, without the plastic`
              : `Closest ${noun} without the plastic`}
          </h2>
          <p className="mb-4 max-w-xl text-sm text-muted-foreground">
            Same garment, same cut{betterMatches[0].sameColour ? ", same colour" : ""}, we only
            swap the fibre. Nothing here is a different kind of clothing.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
            {betterMatches.map((m) => (
              <div key={m.item.id}>
                <ProductCard product={m.item} />
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-semibold ${
                      m.tier === "exact" ? "bg-grade-a/15 text-grade-a" : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {m.tier === "exact" ? "SAME COLOUR & DESIGN" : m.sameColour ? "SAME COLOUR" : "OTHER COLOUR"}
                  </span>
                  <span className="text-grade-a">−{m.plasticSaved}% plastic</span>
                  <span className="text-muted-foreground">
                    {m.priceDelta === 0
                      ? "same price"
                      : m.priceDelta < 0
                        ? `${formatPrice(Math.abs(m.priceDelta), product.currency)} cheaper`
                        : `${formatPrice(m.priceDelta, product.currency)} more`}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* nothing qualified, say so, rather than filling the space with junk */}
      {betterMatches.length === 0 && noMatchReason === "no-better-fibre-in-this-style" && (
        <section className="mt-12 rounded-xl2 border border-border bg-surface p-6" data-testid="no-better-fibre">
          <p className="eyebrow">The same {noun}, better fabric</p>
          <h2 className="mt-1 font-serif text-[28px] font-medium italic tracking-tight">
            No better-fibre {noun} yet
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            We haven&apos;t found a {noun} with less plastic that we&apos;d call the
            same garment. We&apos;d rather show you nothing than a different item, try the
            secondhand check below, or browse every plastic-free{" "}
            <Link href={`/search?category=${product.category}&pure=1`} className="underline underline-offset-2 hover:text-primary">
              {titleCase(product.category)}
            </Link>
            .
          </p>
        </section>
      )}

      {/* find it secondhand, the resale check */}
      <section className="mt-12 rounded-xl2 border border-border bg-surface p-6" data-testid="secondhand">
        <p className="eyebrow">Already made</p>
        <h2 className="mt-1 font-serif text-[28px] font-medium italic tracking-tight sm:text-[28px]">
          Check it secondhand first
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          The lowest-impact garment is one that already exists. Search this piece across the
          resale platforms before buying new.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RESALE_PLATFORMS.map((r) => (
            <a
              key={r.name}
              href={r.search(secondhandTerm)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              data-testid={`resale-${r.name.split(" ")[0].toLowerCase()}`}
              className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <p className="flex items-center justify-between font-medium">
                {r.name}
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{r.tagline}</p>
            </a>
          ))}
        </div>
      </section>

      {/* similar */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-[28px] font-medium italic tracking-tight">
            More {noun === "piece" ? "like this" : `${noun}s`}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
            {spreadByImage(similar).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
