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
import { Reveal } from "@/components/kinetic";
import {
  FibreRanking,
  GradeSpectrum,
  ScoreAnatomy,
} from "@/components/methodology-visuals";

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
      <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
        The anatomy of a <span className="italic text-primary">score</span>
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">No black box. Watch 100 points come together.</p>

      {/* the equation, visualised */}
      <Reveal className="mt-4">
        <ScoreAnatomy />
      </Reveal>

      {/* four components as compact cards, minimal words */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Fibre", "0–70", "var(--grade-a)", "what it's made of"],
          ["Certs", `0–${CERT_CAP}`, "var(--grade-b)", "verified, or they don't count"],
          ["Practices", `0–${PRACTICE_CAP}`, "var(--grade-c)", "deadstock, dyes, repair"],
          ["Brand", "0–6", "var(--primary)", "labour & transparency"],
        ].map(([t, range, color, d], i) => (
          <Reveal key={t} delay={i * 0.08}>
            <div className="rounded-xl2 border border-border bg-surface p-4">
              <span className="inline-block size-3 rounded-full" style={{ background: color }} />
              <p className="mt-2 font-display font-bold">
                {t} <span className="text-sm font-normal text-primary">{range}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* grade spectrum */}
      <Reveal className="mt-12">
        <h2 className="font-display text-xl font-bold">From E to A</h2>
        <GradeSpectrum />
      </Reveal>

      {/* fibre league table */}
      <Reveal className="mt-12">
        <h2 className="font-display text-xl font-bold">Every fibre, ranked</h2>
        <p className="text-xs text-muted-foreground">Hover a row for the why.</p>
        <FibreRanking materials={materials} labels={MATERIAL_LABELS} notes={MATERIAL_NOTES} />
      </Reveal>

      {/* certification points */}
      <Reveal className="mt-12">
        <h2 className="font-display text-xl font-bold">
          Certifications <span className="text-sm font-normal text-muted-foreground">capped at {CERT_CAP}</span>
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {certs.map(([c, pts]) => (
            <span key={c} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium">
              {c} <b className="text-primary">+{pts}</b>
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-12">
        <Link
          href="/search"
          className="group flex items-center justify-between rounded-xl2 border border-border bg-accent/40 p-5 transition-colors hover:border-primary/40"
        >
          <p className="font-display font-bold">
            Deterministic, not vibes. <span className="font-normal text-muted-foreground">Tap any score to see it itemised.</span>
          </p>
          <Leaf className="size-5 text-primary transition-transform group-hover:rotate-12" />
        </Link>
      </Reveal>
    </div>
  );
}
