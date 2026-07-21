import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { MATERIAL_LABELS, MATERIAL_NOTES, MATERIAL_SCORES } from "@/lib/scoring";
import { FIBRE_CLASS, MATERIAL_FACTS } from "@/lib/materials";
import type { MaterialId } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Leaf } from "@/components/icons";

interface Props {
  params: Promise<{ id: string }>;
}

const FABRIC_IDS = Object.keys(MATERIAL_LABELS).filter((m) => m !== "other") as MaterialId[];

export function generateStaticParams() {
  return FABRIC_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const material = id as MaterialId;
  if (!FABRIC_IDS.includes(material)) return {};
  return {
    title: `${MATERIAL_LABELS[material]} clothing — impact, facts & products | The Fibre Set`,
    description: `${MATERIAL_NOTES[material]} Shop ${MATERIAL_LABELS[material].toLowerCase()} clothing with transparent sustainability scores.`,
  };
}

export default async function FabricPage({ params }: Props) {
  const { id } = await params;
  const material = id as MaterialId;
  if (!FABRIC_IDS.includes(material)) notFound();

  const all = await getCatalog();
  const products = all
    .filter((p) => p.fabric_composition.some((f) => f.material === material && f.pct >= 30))
    .sort((a, b) => b.sustainability.score - a.sustainability.score);

  const fact = MATERIAL_FACTS[material];
  const score = MATERIAL_SCORES[material];
  const fibreClass = FIBRE_CLASS[material];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-xl2 border border-primary/25 bg-accent/40 p-6 sm:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <Leaf className="size-3.5 text-primary" /> {fibreClass === "natural" ? "Natural fibre" : fibreClass === "regenerated" ? "Regenerated fibre" : "Synthetic fibre"}
          <span>· impact score {score}/10</span>
        </p>
        <h1 className="font-serif text-4xl font-medium italic tracking-tight sm:text-5xl">{MATERIAL_LABELS[material]}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{MATERIAL_NOTES[material]}</p>
        {fact && (
          <div className="mt-4 max-w-md rounded-lg border-l-2 border-primary bg-surface p-4">
            <p className="font-display font-bold text-primary">{fact.stat}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fact.detail}</p>
            <p className="mt-1.5 text-[11px] italic text-muted-foreground">— {fact.source}</p>
          </div>
        )}
      </div>

      <div className="mb-4 mt-8 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold">
          {products.length} {MATERIAL_LABELS[material].toLowerCase()} pieces
        </h2>
        <Link href={`/search?fabric=${material}`} className="text-sm font-medium text-primary hover:underline">
          Filter & refine →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {products.slice(0, 24).map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
      {products.length > 24 && (
        <div className="mt-6 text-center">
          <Link
            href={`/search?fabric=${material}`}
            className="inline-block rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium hover:bg-surface-2"
          >
            See all {products.length}
          </Link>
        </div>
      )}
    </div>
  );
}
