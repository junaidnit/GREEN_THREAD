import { describe, expect, it } from "vitest";
import { scoutVerdict, type ScoutStats } from "@/lib/scout";

const stats = (over: Partial<ScoutStats>): ScoutStats => ({
  feedFound: true,
  scanned: 150,
  disclosed: 90,
  majorityNatural: 80,
  garments: 70,
  ...over,
});

describe("scoutVerdict — the Catalog-Growth crew's onboarding gate", () => {
  it("GOes for a healthy natural-fibre brand", () => {
    const v = scoutVerdict(stats({}));
    expect(v.go).toBe(true);
    expect(v.score).toBeGreaterThan(60);
    expect(v.reasons.join(" ")).toMatch(/clears every bar/);
  });

  it("NO-GO when there is no feed at all", () => {
    const v = scoutVerdict(stats({ feedFound: false, scanned: 0, disclosed: 0, majorityNatural: 0, garments: 0 }));
    expect(v.go).toBe(false);
    expect(v.reasons[0]).toMatch(/No public product feed/);
  });

  it("NO-GO when labels don't disclose composition (the honesty bar)", () => {
    const v = scoutVerdict(stats({ scanned: 150, disclosed: 10, majorityNatural: 10, garments: 10 }));
    expect(v.go).toBe(false);
    expect(v.reasons.join(" ")).toMatch(/honesty bar/);
  });

  it("NO-GO for a mostly-synthetic brand, even with great disclosure", () => {
    const v = scoutVerdict(stats({ disclosed: 100, majorityNatural: 20 }));
    expect(v.go).toBe(false);
    expect(v.reasons.join(" ")).toMatch(/Mostly synthetic/);
  });

  it("NO-GO for a tiny catalogue or an accessories-only feed", () => {
    expect(scoutVerdict(stats({ scanned: 12, disclosed: 10, majorityNatural: 10, garments: 8 })).go).toBe(false);
    expect(scoutVerdict(stats({ garments: 3 })).go).toBe(false);
  });

  it("caps the ranking score for NO-GO brands so they never outrank a GO", () => {
    const noGo = scoutVerdict(stats({ majorityNatural: 20 }));
    const go = scoutVerdict(stats({}));
    expect(noGo.score).toBeLessThanOrEqual(30);
    expect(go.score).toBeGreaterThan(noGo.score);
  });
});
