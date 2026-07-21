import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import type { MaterialId, Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "The Journal — The Fibre Set",
  description:
    "Editorial and education on natural fibres — for sensitive skin, menopause, hot sleepers and non-toxic living. Informative, never preachy.",
};

const dominant = (p: Product, m: MaterialId) =>
  [...p.fabric_composition].sort((a, b) => b.pct - a.pct)[0]?.material === m;

export default async function JournalPage() {
  const products = await getCatalog();
  const img = (m: MaterialId) => products.find((p) => dominant(p, m) && p.image_url)?.image_url ?? products[0]?.image_url ?? null;

  const pieces = [
    { eyebrow: "Sensitive skin", title: "The fibres that calm reactive, eczema-prone skin", blurb: "Why smooth, low-friction silk and long-staple organic cotton settle skin that reacts to everything else — and the synthetics and finishes to keep away from it.", href: "/condition/eczema", m: "peace_silk" as MaterialId, big: true },
    { eyebrow: "Menopause", title: "Dressing for the 3am flash", blurb: "How merino, linen and TENCEL move with a temperature surge — and the 'cooling' synthetic PJs worth avoiding.", href: "/search?fabric=merino_wool", m: "merino_wool" as MaterialId },
    { eyebrow: "Breathability", title: "Why linen earns its place against hot skin", blurb: "Hollow flax fibres and an open weave move heat away — the plain case for linen in summer and in bed.", href: "/fabric/linen", m: "linen" as MaterialId },
    { eyebrow: "Non-toxic living", title: "What actually sheds onto your skin", blurb: "The plain version of the microplastics question — and the natural fibres that shed nothing at all.", href: "/label-watch", m: "organic_cotton" as MaterialId },
    { eyebrow: "The materials", title: "Hemp: the strongest fibre we don't talk about", blurb: "Rain-fed, pesticide-free and tougher every wash — why hemp deserves a place next to linen.", href: "/fabric/hemp", m: "hemp" as MaterialId },
    { eyebrow: "How we choose", title: "Reading a label, honestly", blurb: "What 'linen-blend' can really mean, and how we score every fibre — nothing hidden in a black box.", href: "/methodology", m: "tencel_lyocell" as MaterialId },
  ];

  const [lead, ...rest] = pieces;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10">
      <div className="mb-12 text-center">
        <span className="eyebrow">The Journal</span>
        <h1 className="mx-auto mt-3 max-w-[20ch] font-display text-[40px] leading-tight text-foreground sm:text-[48px]">
          Reading, close to the skin.
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-[15px] font-light leading-relaxed text-muted-foreground">
          Fibre education and condition-led editorial — informative, never preachy. Check the label; it&apos;s free.
        </p>
      </div>

      {/* lead article */}
      <Link href={lead.href} className="group grid gap-8 border-b border-border pb-14 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          {img(lead.m) && <Image src={img(lead.m)!} alt="" fill sizes="(max-width:768px) 100vw, 50vw" priority className="object-cover transition-transform duration-700 group-hover:scale-105" />}
        </div>
        <div className="flex flex-col justify-center">
          <span className="eyebrow">{lead.eyebrow}</span>
          <h2 className="mt-3 font-display text-[32px] leading-tight text-foreground group-hover:text-primary">{lead.title}</h2>
          <p className="mt-4 max-w-[46ch] text-[15px] font-light leading-relaxed text-muted-foreground">{lead.blurb}</p>
          <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Read →</span>
        </div>
      </Link>

      {/* grid */}
      <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((a) => (
          <Link key={a.href} href={a.href} className="group">
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
              {img(a.m) && <Image src={img(a.m)!} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
            </div>
            <span className="eyebrow mt-4 block">{a.eyebrow}</span>
            <h3 className="mt-2 font-display text-[20px] leading-snug text-foreground group-hover:text-primary">{a.title}</h3>
            <p className="mt-2 text-[13px] font-light leading-relaxed text-muted-foreground">{a.blurb}</p>
            <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Read →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
