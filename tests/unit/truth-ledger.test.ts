import { describe, expect, it } from "vitest";
import {
  recordObservations,
  toTruthEntry,
  historyFor,
  hasChanged,
  latestEntry,
  type TruthLedger,
} from "@/lib/truth-ledger";
import type { FabricPart } from "@/lib/types";

const POLY: FabricPart[] = [{ material: "polyester", label: "Polyester", pct: 100 }];
const COTTON: FabricPart[] = [{ material: "organic_cotton", label: "Organic Cotton", pct: 100 }];

const prod = (over: { id: string; title?: string; fabric?: FabricPart[]; score?: number }) => ({
  id: over.id,
  brand_slug: "brand",
  title: over.title ?? "Organic Tee",
  fabric_composition: over.fabric ?? COTTON,
  source: "live",
  sustainability: { score: over.score ?? 80, grade: "A" },
});

const empty: TruthLedger = { recorded_at: "", entries: [] };

describe("truth ledger", () => {
  it("records a first-seen entry with a stable hash", () => {
    const e = toTruthEntry(prod({ id: "a" }), "2026-07-19");
    expect(e.product_id).toBe("a");
    expect(e.plastic_pct).toBe(0);
    expect(e.natural_pct).toBe(100);
    expect(e.hash).toMatch(/^[0-9a-f]{8}$/);
    // same input → same hash (deterministic)
    expect(toTruthEntry(prod({ id: "a" }), "2026-07-20").hash).toBe(e.hash);
  });

  it("captures greenwash: a misnamed 'linen' item that's mostly plastic", () => {
    const e = toTruthEntry(
      prod({
        id: "gw",
        title: "Linen-Blend Tee",
        fabric: [
          { material: "polyester", label: "Polyester", pct: 72 },
          { material: "linen", label: "Linen", pct: 28 },
        ],
      }),
      "2026-07-19",
    );
    expect(e.misnamed).toEqual({ fibre: "linen", actualPct: 28 });
    expect(e.plastic_pct).toBe(72);
  });

  it("appends on first sight, then stays silent when nothing changes", () => {
    const first = recordObservations(empty, [prod({ id: "a" })], "2026-07-19");
    expect(first.firstSeen).toBe(1);
    expect(first.added).toBe(1);

    const again = recordObservations(first.ledger, [prod({ id: "a" })], "2026-07-20");
    expect(again.added).toBe(0); // identical observation → no new entry
    expect(again.ledger.entries).toHaveLength(1);
  });

  it("records a new version when composition changes (the moat: versioned truth)", () => {
    const day1 = recordObservations(empty, [prod({ id: "a", fabric: COTTON })], "2026-07-19");
    const day2 = recordObservations(
      day1.ledger,
      [prod({ id: "a", fabric: POLY })], // brand quietly swapped the fabric
      "2026-08-01",
    );
    expect(day2.changed).toBe(1);
    expect(day2.ledger.entries).toHaveLength(2);
    expect(hasChanged(day2.ledger, "a")).toBe(true);

    const history = historyFor(day2.ledger, "a");
    expect(history.map((e) => e.plastic_pct)).toEqual([0, 100]);
    expect(latestEntry(day2.ledger, "a")?.plastic_pct).toBe(100);
  });

  it("tracks many products independently in one pass", () => {
    const out = recordObservations(
      empty,
      [prod({ id: "a" }), prod({ id: "b" }), prod({ id: "c" })],
      "2026-07-19",
    );
    expect(out.firstSeen).toBe(3);
    expect(hasChanged(out.ledger, "a")).toBe(false);
  });
});
