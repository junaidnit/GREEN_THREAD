import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { allMisnamed, ledgerStats } from "@/lib/truth-server";
import { titleCase } from "@/lib/format";
import { Reveal } from "@/components/kinetic";
import { AlertTriangle } from "@/components/icons";

export const metadata: Metadata = {
  title: "Label Watch — named natural, mostly plastic",
  description:
    "The Fibre Set's independent, timestamped record of clothes named after natural fibres that are mostly oil-derived plastic. Every flag is on the record, with the date we first logged it.",
  alternates: { canonical: "/label-watch" },
};

export default async function LabelWatchPage() {
  const stats = ledgerStats();
  const products = await getCatalog();
  const brandName = new Map(products.map((p) => [p.brand.slug, p.brand.name]));
  const known = new Set(products.map((p) => p.id));
  // only surface flags for products currently in the catalog (never a stale item)
  const flagged = allMisnamed().filter((f) => known.has(f.product_id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Reveal>
        <p className="eyebrow text-grade-d">Label Watch</p>
        <h1 className="mt-2 font-serif text-4xl font-medium italic tracking-tight sm:text-5xl">
          Named natural. Mostly plastic.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Brands love to name a garment after a natural fibre it barely contains — a
          &ldquo;Linen-Blend&rdquo; tee that&apos;s 72% polyester. We read every label and keep an
          independent, timestamped record of the ones that mislead. Nothing here is our opinion:
          it&apos;s the disclosed composition versus the name on the tag.
        </p>
        {stats && (
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4 text-sm">
            <span><b className="text-lg tabular-nums">{flagged.length}</b> <span className="text-muted-foreground">items on Label Watch</span></span>
            <span><b className="text-lg tabular-nums">{stats.products.toLocaleString()}</b> <span className="text-muted-foreground">products on record</span></span>
            <span><b className="text-lg tabular-nums">{stats.readings.toLocaleString()}</b> <span className="text-muted-foreground">verified readings</span></span>
            <span className="text-muted-foreground">tracking since {new Date(stats.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
          </div>
        )}
      </Reveal>

      <ul data-testid="label-watch-list" className="mt-8 divide-y divide-border">
        {flagged.map((f) => {
          const row = (
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="eyebrow truncate">{brandName.get(f.brand_slug) ?? titleCase(f.brand_slug)}</p>
                <p className="mt-0.5 truncate font-medium">{f.title}</p>
                <p className="mt-1 text-sm text-grade-d">
                  <AlertTriangle className="mr-1 inline size-3.5" />
                  Named after {f.fibre} — but only <b>{f.actualPct}% {f.fibre}</b>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-2xl font-bold text-grade-d tabular-nums">{f.plastic_pct}%</p>
                <p className="text-[12px] uppercase tracking-wide text-muted-foreground">plastic</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  logged {new Date(f.trackedSince).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          );
          return (
            <li key={f.product_id}>
              {known.has(f.product_id) ? (
                <Link href={`/product/${f.product_id}`} className="block transition-colors hover:bg-surface-2/50">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>

      {flagged.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          Nothing on Label Watch yet — the ledger is still warming up.
        </p>
      )}

      <div className="mt-12 rounded-xl2 border border-border bg-surface p-6 text-sm text-muted-foreground">
        <p>
          <b className="text-foreground">How this works.</b> Every product we see is logged
          with its disclosed fibre composition and the date. When a name claims a fibre the garment is
          mostly not, it lands here — permanently, with its history. From 2028 the EU Digital Product
          Passport will make fibre disclosure mandatory; we&apos;re building the independent record now.
        </p>
        <p className="mt-3">
          See how we score fibres on our{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-primary">methodology</Link> page.
        </p>
      </div>
    </div>
  );
}
