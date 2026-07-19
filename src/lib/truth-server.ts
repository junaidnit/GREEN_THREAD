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
