import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { dataPath } from "./data-root";
import { historyFor, type TruthEntry, type TruthLedger } from "./truth-ledger";

/** Server-side read of the append-only truth ledger (cached in-process). */
let _ledger: TruthLedger | null | undefined;

function loadLedger(): TruthLedger | null {
  if (_ledger !== undefined) return _ledger;
  const p = dataPath("data", "truth-ledger.json");
  _ledger = existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as TruthLedger) : null;
  return _ledger ?? null;
}

export interface TruthRecord {
  /** ISO date we first put this product on record. */
  trackedSince: string;
  /** Observed versions, oldest → newest. */
  history: TruthEntry[];
  /** True if composition/score/honesty ever changed on our watch. */
  changed: boolean;
}

export function truthRecordFor(productId: string): TruthRecord | null {
  const ledger = loadLedger();
  if (!ledger) return null;
  const history = historyFor(ledger, productId);
  if (history.length === 0) return null;
  return {
    trackedSince: history[0].observed_at,
    history,
    changed: history.length > 1,
  };
}

export interface MisnamedRecord {
  product_id: string;
  brand_slug: string;
  title: string;
  fibre: string;
  actualPct: number;
  plastic_pct: number;
  trackedSince: string;
}

/**
 * The Label Watch list: every product currently on record whose name claims
 * a fibre it mostly is NOT. Most-misleading (most plastic) first. Powers the
 * public greenwashing transparency page. The Fibre Set's counter-position.
 */
export function allMisnamed(): MisnamedRecord[] {
  const ledger = loadLedger();
  if (!ledger) return [];
  const byId = new Map<string, MisnamedRecord>();
  for (const e of ledger.entries) {
    if (!e.misnamed) continue;
    // Only publish DEFENSIBLE flags: the named fibre is genuinely present but
    // a minority (a real "linen blend that's mostly polyester"), and the item
    // is majority plastic. We exclude actualPct === 0, because "named after a
    // fibre that's 0% present" almost always means we parsed only the lining/
    // padding and missed the shell, a false accusation, not greenwash.
    if (e.misnamed.actualPct < 1) continue;
    if (e.plastic_pct < 50) continue;
    const prev = byId.get(e.product_id);
    if (!prev || e.observed_at >= prev.trackedSince) {
      byId.set(e.product_id, {
        product_id: e.product_id,
        brand_slug: e.brand_slug,
        title: e.title,
        fibre: e.misnamed.fibre,
        actualPct: e.misnamed.actualPct,
        plastic_pct: e.plastic_pct,
        trackedSince: historyFor(ledger, e.product_id)[0]?.observed_at ?? e.observed_at,
      });
    }
  }
  return [...byId.values()].sort((a, b) => b.plastic_pct - a.plastic_pct);
}

/** How many products, brands, and greenwash flags the ledger holds. */
export function ledgerStats(): { products: number; readings: number; flagged: number; since: string } | null {
  const ledger = loadLedger();
  if (!ledger || ledger.entries.length === 0) return null;
  const products = new Set(ledger.entries.map((e) => e.product_id));
  const flagged = new Set(ledger.entries.filter((e) => e.misnamed).map((e) => e.product_id));
  const since = ledger.entries.reduce((min, e) => (e.observed_at < min ? e.observed_at : min), ledger.entries[0].observed_at);
  return { products: products.size, readings: ledger.entries.length, flagged: flagged.size, since };
}
