"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CompositionBars } from "@/components/composition-bars";
import { ScoreDial } from "@/components/score-dial";
import { ArrowUpRight, AlertTriangle, BadgeCheck, Leaf, Search, Sparkles } from "@/components/icons";
import type { FabricPart, ScoreFactor } from "@/lib/types";

interface Analysis {
  url: string;
  site: string;
  title: string;
  image: string | null;
  price_text: string;
  found_composition: boolean;
  fabric_composition: FabricPart[];
  certifications: string[];
  greenwash_flags: string[];
  explanation: string;
  score: number | null;
  grade: string | null;
  factors: ScoreFactor[];
  error?: string;
}

const EXAMPLES = [
  "Any product page from a clothing site",
  "Works best when the page lists fabric composition",
];

export function AnalyzeClient() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(target: string) {
    const t = target.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: t }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else setResult(data);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  }

  // auto-run when arriving with ?url= (e.g. pasted a link into search)
  useEffect(() => {
    const fromParam = searchParams.get("url");
    if (fromParam) analyze(fromParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Fabric Check
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Paste any product link.
          <br />
          <span className="text-primary">We read the label for you.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Shopping somewhere else? Drop the product URL here — we&apos;ll pull what the page
          discloses, extract the fabric story, and score it with the same transparent rubric.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(url);
        }}
        className="mx-auto mt-7 flex h-13 max-w-xl items-center gap-2 rounded-full border border-border bg-surface px-4 shadow-lg shadow-black/[0.04] focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          data-testid="analyze-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://retailer.com/product/…"
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          inputMode="url"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          data-testid="analyze-submit"
          className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {busy ? "Reading…" : "Check it"}
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">{EXAMPLES.join(" · ")}</p>

      {busy && (
        <div className="mt-8 space-y-3" data-testid="analyze-loading">
          <div className="skeleton h-24 w-full rounded-xl2" />
          <div className="skeleton h-40 w-full rounded-xl2" />
          <p className="text-center text-xs text-muted-foreground">
            Fetching the page → reading the label → scoring the fibres…
          </p>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl2 border border-grade-d/40 bg-grade-d/5 p-4 text-center text-sm" data-testid="analyze-error">
          <AlertTriangle className="mx-auto mb-1 size-5 text-grade-d" />
          {error}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 overflow-hidden rounded-xl2 border border-border bg-surface"
          data-testid="analyze-result"
        >
          {/* header row */}
          <div className="flex gap-4 border-b border-border p-5">
            {result.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.image}
                alt=""
                className="size-20 shrink-0 rounded-lg border border-border object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{result.site}</p>
              <h2 className="mt-0.5 font-display text-lg font-bold leading-snug">{result.title}</h2>
              {result.price_text && <p className="mt-1 text-sm font-semibold">{result.price_text}</p>}
            </div>
            {result.score != null && (
              <div className="shrink-0 scale-75 sm:scale-90">
                <ScoreDial score={result.score} grade={result.grade!} />
              </div>
            )}
          </div>

          <div className="space-y-5 p-5">
            {result.found_composition ? (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
                  <Leaf className="size-4 text-primary" /> What it&apos;s made of
                </h3>
                <CompositionBars parts={result.fabric_composition} />
              </div>
            ) : (
              <div className="rounded-lg border border-grade-c/40 bg-grade-c/10 p-4 text-sm">
                <b>This page doesn&apos;t disclose its fabric composition.</b>{" "}
                That itself is a signal — brands proud of their materials say so. Check the
                physical label, or ask the retailer.
              </div>
            )}

            {result.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.certifications.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                    <BadgeCheck className="size-3.5 text-primary" /> {c}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">{result.explanation}</p>

            {result.greenwash_flags.length > 0 && (
              <div className="rounded-lg border border-grade-d/40 bg-grade-d/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-grade-d">
                  <AlertTriangle className="size-4" /> Claims we couldn&apos;t verify
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                  {result.greenwash_flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {result.factors.length > 0 && (
              <div className="space-y-2">
                {result.factors.map((f, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 rounded-lg bg-surface-2 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.detail}</p>
                    </div>
                    <span className={`shrink-0 font-display text-sm font-bold ${f.points >= 0 ? "text-grade-a" : "text-grade-e"}`}>
                      {f.points >= 0 ? "+" : ""}{f.points}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  Scored on fibres, certifications and stated practices only — we can&apos;t assess
                  an unknown brand&apos;s supply chain from one page.
                </p>
              </div>
            )}

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              data-testid="analyze-visit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
            >
              View it on {result.site} <ArrowUpRight className="size-4" />
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
