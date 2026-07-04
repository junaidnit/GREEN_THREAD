import type { Metadata } from "next";
import Link from "next/link";
import {
  CERT_CAP,
  CERT_POINTS,
  MATERIAL_LABELS,
  MATERIAL_SCORES,
  PRACTICE_CAP,
} from "@/lib/scoring";
import { MATERIAL_NOTES } from "@/lib/scoring";
import type { MaterialId } from "@/lib/types";
import { Leaf } from "@/components/icons";

export const metadata: Metadata = {
  title: "How we score — GreenThread methodology",
  description:
    "Every GreenThread sustainability score is computed with a published, deterministic rubric: fibre impact, certifications, brand practices. No black box.",
};

export default function MethodologyPage() {
  const materials = (Object.entries(MATERIAL_SCORES) as Array<[MaterialId, number]>)
    .filter(([m]) => m !== "other")
    .sort((a, b) => b[1] - a[1]);
  const certs = Object.entries(CERT_POINTS).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
        <Leaf className="size-3.5 text-primary" /> Methodology
      </p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">How we score</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        No black box. Every score out of 100 is the sum of four published components,
        and every product page shows exactly which points it earned and why.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          ["Fibre composition", "0–70", "Each fibre has a published impact score (below), weighted by its share of the garment."],
          ["Certifications", `0–${CERT_CAP}`, "Only certifications stated with evidence count — our pipeline rejects unverifiable claims."],
          ["Brand practices", "0–6", "Transparency, labour record and supply-chain accountability at brand level."],
          ["Product practices", `0–${PRACTICE_CAP}`, "Deadstock fabric, natural dyes, repair programmes, take-back schemes and more."],
        ].map(([t, range, d]) => (
          <div key={t} className="rounded-xl2 border border-border bg-surface p-4">
            <p className="font-display font-bold">{t} <span className="ml-1 text-sm font-normal text-primary">{range}</span></p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Grades</h2>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-white">
        <span className="rounded-full bg-grade-a px-3 py-1.5">A · 80–100 exceptional</span>
        <span className="rounded-full bg-grade-b px-3 py-1.5">B · 65–79 strong</span>
        <span className="rounded-full bg-grade-c px-3 py-1.5">C · 50–64 mixed</span>
        <span className="rounded-full bg-grade-d px-3 py-1.5">D · 35–49 weak</span>
        <span className="rounded-full bg-grade-e px-3 py-1.5">E · under 35 poor</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        A is deliberately hard to reach — near-perfect fibres plus verified certifications plus real practices.
      </p>

      <h2 className="mt-10 font-display text-xl font-bold">Fibre impact scores</h2>
      <div className="mt-3 overflow-hidden rounded-xl2 border border-border">
        {materials.map(([m, score]) => (
          <div key={m} className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 text-sm last:border-0">
            <span className="w-40 shrink-0 font-medium">{MATERIAL_LABELS[m]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${score * 10}%`,
                  background: score >= 8 ? "var(--grade-a)" : score >= 6.5 ? "var(--grade-b)" : score >= 4.5 ? "var(--grade-c)" : score >= 3 ? "var(--grade-d)" : "var(--grade-e)",
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-display font-bold">{score}</span>
            <span className="hidden w-64 shrink-0 text-[11px] leading-tight text-muted-foreground lg:block">
              {MATERIAL_NOTES[m]}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Certification points</h2>
      <p className="mt-1 text-xs text-muted-foreground">Capped at {CERT_CAP} total — stacking labels can&apos;t outweigh what a garment is made of.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {certs.map(([c, pts]) => (
          <span key={c} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium">
            {c} <b className="text-primary">+{pts}</b>
          </span>
        ))}
      </div>

      <div className="mt-10 rounded-xl2 border border-border bg-accent/40 p-5 text-sm">
        <p className="font-semibold">Why trust this?</p>
        <p className="mt-1 text-muted-foreground">
          Extraction is AI-assisted, but scoring is deterministic code — same inputs, same score,
          every time. Certifications claimed without evidence are dropped automatically, and vague
          eco-language is flagged on the product page, not hidden. Browse the{" "}
          <Link href="/search" className="text-primary underline-offset-2 hover:underline">catalog</Link>{" "}
          and tap any score to see it itemised.
        </p>
      </div>
    </div>
  );
}
