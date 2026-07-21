import { describe, expect, it } from "vitest";
import { fibreMark, misleadingName, naturalPct, oilDerivedPct } from "@/lib/materials";
import type { FabricPart } from "@/lib/types";

const parts = (...p: Array<[FabricPart["material"], number]>): FabricPart[] =>
  p.map(([material, pct]) => ({ material, label: material, pct }));

describe("oilDerivedPct (purist: recycled synthetics count)", () => {
  it("flags virgin polyester", () => {
    expect(oilDerivedPct(parts(["polyester", 100]))).toBe(100);
  });
  it("flags recycled polyester and nylon too", () => {
    expect(oilDerivedPct(parts(["recycled_polyester", 60], ["organic_cotton", 40]))).toBe(60);
    expect(oilDerivedPct(parts(["recycled_polyamide", 78], ["elastane", 22]))).toBe(100);
  });
  it("counts trace elastane", () => {
    expect(oilDerivedPct(parts(["organic_cotton", 95], ["elastane", 5]))).toBe(5);
  });
  it("regenerated cellulosics are NOT oil-derived", () => {
    expect(oilDerivedPct(parts(["tencel_lyocell", 70], ["viscose", 30]))).toBe(0);
  });
});

describe("fibreMark", () => {
  it("100% natural for pure grown fibre", () => {
    expect(fibreMark(parts(["linen", 100]))).toMatchObject({ label: "100% natural", tone: "natural" });
  });
  it("plastic-free for regenerated blends without synthetics", () => {
    expect(fibreMark(parts(["tencel_lyocell", 70], ["organic_cotton", 30]))).toMatchObject({
      label: "Plastic-free",
      tone: "plastic-free",
    });
  });
  it("names the plastic share otherwise", () => {
    expect(fibreMark(parts(["polyester", 72], ["linen", 28]))).toMatchObject({
      label: "72% plastic",
      tone: "plastic",
      plastic: 72,
    });
  });
});

describe("misleadingName — the 'Linen blend (90% polyester)' detector", () => {
  it("flags a Linen-Blend that is mostly polyester", () => {
    expect(misleadingName("Linen-Blend Midi Dress — Coral", parts(["polyester", 72], ["linen", 28]))).toEqual({
      fibre: "linen",
      actualPct: 28,
    });
  });
  it("does not flag honest naming", () => {
    expect(misleadingName("Breezy Linen Shirt", parts(["linen", 100]))).toBeNull();
  });
  it("aggregates fibre families (all cottons)", () => {
    expect(misleadingName("Cotton Tee", parts(["organic_cotton", 40], ["recycled_cotton", 20], ["polyester", 40]))).toBeNull();
    expect(misleadingName("Cotton Tee", parts(["conventional_cotton", 30], ["polyester", 70]))).toEqual({
      fibre: "cotton",
      actualPct: 30,
    });
  });
  it("ignores titles without fibre words", () => {
    expect(misleadingName("Wide-Leg Jeans — Indigo", parts(["polyester", 100]))).toBeNull();
  });
});

describe("naturalPct", () => {
  it("counts only grown fibres", () => {
    expect(naturalPct(parts(["linen", 50], ["tencel_lyocell", 30], ["polyester", 20]))).toBe(50);
  });
});

describe("misleadingName — 0% is a parse miss, not a flag", () => {
  it("does not accuse a brand when the named fibre parsed as 0%", () => {
    // lined/multi-part garments routinely hide the shell composition in a
    // separate line; 0% means we failed to read it, not that it isn't there
    expect(misleadingName("SAVANNAH - Organic Linen Cotton Tie Top", [{ material: "linen", pct: 100 }])).toBeNull();
  });

  it("still flags a genuine minority-fibre name", () => {
    expect(
      misleadingName("Linen-Blend Tee", [
        { material: "linen", pct: 28 },
        { material: "polyester", pct: 72 },
      ]),
    ).toEqual({ fibre: "linen", actualPct: 28 });
  });
});
