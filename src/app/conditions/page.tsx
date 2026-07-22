import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getShopCatalog } from "@/lib/catalog";
import { CONDITIONS, CONDITION_SLUGS, isConditionSafe, type ConditionSlug } from "@/lib/conditions";
import { MATERIAL_LABELS } from "@/lib/scoring";
import { garmentType, type GarmentType } from "@/lib/garment";
import type { Product } from "@/lib/types";
import { sized, IMG } from "@/lib/image";

export const metadata: Metadata = {
  title: "Dressing for a skin condition",
  description:
    "Clothing filtered by an explicit, published rule for eczema, psoriasis, textile contact allergy and night sweats. Every excluded fibre is named, with the reason.",
  alternates: { canonical: "/conditions" },
};

/* Same principle as the fibre tiles: a photo that shows cloth, never an
   accessory or a secondhand listing. */
const SHOWS_CLOTH: Partial<Record<GarmentType, number>> = {
  dress: 6, jumpsuit: 6, coat: 5, jacket: 5, jumper: 5, cardigan: 5,
  shirt: 5, blouse: 5, skirt: 4, trousers: 4, tee: 3, sweatshirt: 3,
};
const SECONDHAND = /pre-?loved|second-?hand/i;

function pickImage(products: Product[]): string | null {
  const best = products
    .filter((p) => p.image_url && !SECONDHAND.test(p.title))
    .map((p) => ({ p, cloth: SHOWS_CLOTH[garmentType(p.title)] ?? 0 }))
    .filter((c) => c.cloth > 0)
    .sort((a, b) => b.cloth - a.cloth || a.p.id.localeCompare(b.p.id))[0];
  return best?.p.image_url ?? null;
}

/**
 * The fibres a rule bars, as a reader would name them.
 *
 * Deduplicating the raw labels is not enough: "Recycled polyester" and
 * "Polyester" both reduce to a "polyester" that differs only by case, so a
 * naive Set produced "Polyester, polyester, Nylon, nylon". A shopper thinks in
 * families, not in our material ids, so collapse to the family.
 */
const FAMILY: Array<[RegExp, string]> = [
  [/wool/i, "wool"],
  [/polyester/i, "polyester"],
  [/polyamide|nylon/i, "nylon"],
  [/elastane|spandex/i, "elastane"],
];

function excludedLabels(slug: ConditionSlug): string[] {
  const out: string[] = [];
  for (const e of CONDITIONS[slug].excludes) {
    const label = MATERIAL_LABELS[e.material] ?? e.material;
    const family = FAMILY.find(([re]) => re.test(label))?.[1] ?? label.toLowerCase();
    if (!out.includes(family)) out.push(family);
  }
  return out;
}

export default async function ConditionsPage() {
  const products = await getShopCatalog();

  const entries = CONDITION_SLUGS.map((slug) => {
    const rule = CONDITIONS[slug];
    const safe = products.filter((p) => isConditionSafe(p.fabric_composition, slug));
    return {
      slug,
      rule,
      count: safe.length,
      image: pickImage(safe),
      excluded: excludedLabels(slug),
    };
  }).sort((a, b) => b.count - a.count);

  const total = products.length;

  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-24 pt-16 sm:px-10">
      {/* header */}
      <div className="max-w-[62ch]">
        <span className="eyebrow">Dressing for a condition</span>
        <h1 className="mt-3 font-display text-[clamp(2rem,4.6vw,2.5rem)] leading-tight text-foreground">
          When the fibre matters more than the look.
        </h1>
        <p className="mt-5 text-[16px] font-light leading-relaxed text-muted-foreground">
          For reactive skin, the label is not a preference. It decides whether a garment is wearable.
          Each edit below filters our whole catalogue by a rule we publish in full: which fibres are
          excluded, and why.
        </p>
        <p className="mt-3 text-[16px] font-light leading-relaxed text-muted-foreground">
          We do not use a &ldquo;natural is safe&rdquo; shortcut, because it is wrong. Wool is a
          natural fibre and one of the most commonly cited eczema irritants, so every wool item is
          excluded from that edit while staying in the one for dye allergy. The nuance is the point.
        </p>
      </div>

      {/* the edits */}
      <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2">
        {entries.map((e) => (
          <article key={e.slug}>
            <Link href={`/condition/${e.slug}`} className="group block">
              <div className="relative aspect-[5/3] overflow-hidden bg-surface-2">
                {e.image && (
                  <Image
                    src={sized(e.image, IMG.panel)!}
                    alt={`${e.rule.name} clothing from The Fibre Set`}
                    fill
                    sizes="(max-width:768px) 100vw, 50vw"
                    quality={90}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                )}
                <span className="absolute left-4 top-4 bg-background/95 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground">
                  {e.count.toLocaleString("en-GB")} pieces
                </span>
              </div>
              <span className="eyebrow mt-5 block">{e.rule.clinicalName}</span>
              <h2 className="mt-2 font-display text-[28px] leading-tight text-foreground group-hover:text-primary">
                {e.rule.name}
              </h2>
            </Link>
            <p className="mt-3 max-w-[52ch] text-[16px] font-light leading-relaxed text-muted-foreground">
              {e.rule.summary}
            </p>

            {/* the rule, stated on the card rather than hidden a click away */}
            <dl className="mt-5 border-t border-border pt-4 text-[14px]">
              <div className="flex gap-3">
                <dt className="w-[5.5rem] shrink-0 font-semibold uppercase tracking-[0.1em] text-[12px] text-muted-foreground">
                  Excluded
                </dt>
                <dd className="font-light text-foreground">{e.excluded.join(", ")}</dd>
              </div>
              <div className="mt-2 flex gap-3">
                <dt className="w-[5.5rem] shrink-0 font-semibold uppercase tracking-[0.1em] text-[12px] text-muted-foreground">
                  Shows
                </dt>
                <dd className="font-light text-muted-foreground">
                  {e.count.toLocaleString("en-GB")} of {total.toLocaleString("en-GB")} pieces pass
                </dd>
              </div>
            </dl>

            <Link
              href={`/condition/${e.slug}`}
              className="mt-5 inline-block border-b border-slate pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate transition-colors hover:text-primary"
            >
              See the edit
            </Link>
          </article>
        ))}
      </div>

      {/* honesty band */}
      <div className="mt-20 border-t border-border pt-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-[20px] text-foreground">This is filtering, not advice</h3>
            <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">
              We are not clinicians. These edits apply a published fibre rule to disclosed
              compositions. They are a starting point for a conversation with your GP or
              dermatologist, not a substitute for one.
            </p>
          </div>
          <div>
            <h3 className="font-display text-[20px] text-foreground">Ambiguity is excluded</h3>
            <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">
              A piece only appears if every disclosed fibre is on the allow list. Anything with an
              unreadable or partial composition is left out rather than guessed at, so a list is
              short before it is wrong.
            </p>
          </div>
          <div>
            <h3 className="font-display text-[20px] text-foreground">One edit is comfort, not clinical</h3>
            <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">
              Night sweats is about thermoregulation rather than a diagnosis, and it is the only edit
              here not grounded in a clinical exclusion. We would rather say so than let it borrow
              authority from the others.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
