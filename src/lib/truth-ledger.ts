import { oilDerivedPct, naturalPct, misleadingName } from "./materials";
import type { FabricPart } from "./types";

/**
 * THE TRUTH LEDGER — The Fibre Set's core defensible asset.
 *
 * An append-only, timestamped, versioned record of what each product was
 * ACTUALLY made of, and whether its name misled, every time we observed it.
 * A week-one competitor has an empty ledger; ours deepens autonomously every
 * time the ingest/sentinel crews run. Over time it becomes the authoritative
 * historical record of who mislabelled what, when — citable, un-fakeable
 * (you can't retroactively claim to have been watching two years ago), and
 * the training corpus for a fibre-specialist model.
 *
 * Pure functions here; the write path lives in scripts/record-truth.ts.
 */

export interface TruthEntry {
  product_id: string;
  brand_slug: string;
  title: string;
  /** ISO date (day granularity — we record at most one change per day). */
  observed_at: string;
  composition: FabricPart[];
  plastic_pct: number;
  natural_pct: number;
  score: number;
  grade: string;
  /** Set when the name claims a fibre the garment is mostly NOT — greenwash. */
  misnamed: { fibre: string; actualPct: number } | null;
  source: string;
  /** Stable hash of the meaningful fields — a new entry is only appended when this changes. */
  hash: string;
}

export interface TruthLedger {
  recorded_at: string;
  entries: TruthEntry[];
}

interface LedgerInput {
  id: string;
  brand_slug: string;
  title: string;
  fabric_composition: FabricPart[];
  source?: string;
  sustainability: { score: number; grade: string };
}

/** Deterministic content hash of the fields whose change is worth recording. */
function hashEntry(e: Omit<TruthEntry, "hash" | "observed_at">): string {
  const canonical = JSON.stringify([
    e.product_id,
    e.composition.map((f) => `${f.material}:${f.pct}`).sort(),
    e.plastic_pct,
    e.score,
    e.grade,
    e.misnamed ? `${e.misnamed.fibre}:${e.misnamed.actualPct}` : "",
  ]);
  // FNV-1a 32-bit — small, stable, dependency-free
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Build a ledger entry for a product as observed today. */
export function toTruthEntry(p: LedgerInput, observedAt: string): TruthEntry {
  const misnamedRaw = misleadingName(p.title, p.fabric_composition);
  const base = {
    product_id: p.id,
    brand_slug: p.brand_slug,
    title: p.title,
    composition: p.fabric_composition,
    plastic_pct: oilDerivedPct(p.fabric_composition),
    natural_pct: naturalPct(p.fabric_composition),
    score: p.sustainability.score,
    grade: p.sustainability.grade,
    misnamed: misnamedRaw ? { fibre: misnamedRaw.fibre, actualPct: misnamedRaw.actualPct } : null,
    source: p.source ?? "generated",
  };
  return { ...base, observed_at: observedAt, hash: hashEntry(base) };
}

/** The most recent entry recorded for a product, or undefined. */
export function latestEntry(ledger: TruthLedger, productId: string): TruthEntry | undefined {
  let latest: TruthEntry | undefined;
  for (const e of ledger.entries) {
    if (e.product_id === productId && (!latest || e.observed_at >= latest.observed_at)) latest = e;
  }
  return latest;
}

export interface LedgerUpdate {
  ledger: TruthLedger;
  added: number;
  changed: number;
  firstSeen: number;
}

/**
 * Fold today's observations into the ledger. Appends an entry only when a
 * product is new or its meaningful fields changed since we last looked —
 * so the ledger stays a true version history, not a daily dump.
 */
export function recordObservations(
  prev: TruthLedger,
  products: LedgerInput[],
  observedAt: string,
): LedgerUpdate {
  const entries = [...prev.entries];
  let added = 0;
  let changed = 0;
  let firstSeen = 0;
  for (const p of products) {
    const entry = toTruthEntry(p, observedAt);
    const last = latestEntry({ recorded_at: prev.recorded_at, entries }, p.id);
    if (!last) {
      entries.push(entry);
      added++;
      firstSeen++;
    } else if (last.hash !== entry.hash) {
      entries.push(entry);
      added++;
      changed++;
    }
  }
  return {
    ledger: { recorded_at: observedAt, entries },
    added,
    changed,
    firstSeen,
  };
}

/** Full observed history for one product, oldest → newest. */
export function historyFor(ledger: TruthLedger, productId: string): TruthEntry[] {
  return ledger.entries
    .filter((e) => e.product_id === productId)
    .sort((a, b) => a.observed_at.localeCompare(b.observed_at));
}

/** Did this product's composition or honesty ever change on our watch? */
export function hasChanged(ledger: TruthLedger, productId: string): boolean {
  return historyFor(ledger, productId).length > 1;
}
