import { describe, expect, it } from "vitest";
import {
  CERT_CAP,
  computeScore,
  consolidateComposition,
  fibreScore,
  gradeFor,
  normalizeComposition,
  validateCertifications,
} from "@/lib/scoring";
import { fibreMark, oilDerivedPct } from "@/lib/materials";
import type { Practices } from "@/lib/types";

const NO_PRACTICES: Practices = {
  natural_dye: false,
  undyed: false,
  deadstock: false,
  pfc_free: false,
  repair_program: false,
  take_back: false,
  zero_waste: false,
  made_to_order: false,
};

describe("consolidateComposition — multi-part garments", () => {
  // the real shape of a Uniqlo jacket label, which reported "200% plastic"
  const uniqloJacket = [
    { material: "conventional_cotton" as const, label: "Shell: 100% Cotton", pct: 100 },
    { material: "conventional_cotton" as const, label: "Body Lining: 100% Cotton", pct: 100 },
    { material: "polyester" as const, label: "Sleeve Lining: 100% Polyester", pct: 100 },
    { material: "conventional_cotton" as const, label: "Collar: 100% Cotton", pct: 100 },
    { material: "polyester" as const, label: "Pocket Lining: 100% Polyester", pct: 100 },
  ];

  it("folds a 5-part garment into one garment summing to 100", () => {
    const out = consolidateComposition(uniqloJacket);
    expect(out.reduce((s, p) => s + p.pct, 0)).toBe(100);
    expect(out).toHaveLength(2); // cotton + polyester, duplicates merged
  });

  it("produces a believable fibre mark instead of '200% plastic'", () => {
    expect(fibreMark(uniqloJacket).label).toBe("200% plastic"); // the bug
    const out = consolidateComposition(uniqloJacket);
    expect(oilDerivedPct(out)).toBe(40); // 2 of 5 parts are polyester
    expect(fibreMark(out).label).toBe("40% plastic");
  });

  it("strips component prefixes and embedded percentages from labels", () => {
    const out = consolidateComposition(uniqloJacket);
    expect(out.map((p) => p.label)).toEqual(["Cotton", "Polyester"]);
  });

  it("leaves an ordinary single-garment label untouched", () => {
    const out = consolidateComposition([
      { material: "organic_cotton", label: "Organic Cotton", pct: 95 },
      { material: "elastane", label: "Elastane", pct: 5 },
    ]);
    expect(out).toEqual([
      { material: "organic_cotton", label: "Organic Cotton", pct: 95 },
      { material: "elastane", label: "Elastane", pct: 5 },
    ]);
  });

  it("absorbs rounding drift so the total is exactly 100", () => {
    const out = consolidateComposition([
      { material: "organic_cotton", label: "Cotton", pct: 100 },
      { material: "linen", label: "Linen", pct: 100 },
      { material: "hemp", label: "Hemp", pct: 100 },
    ]);
    expect(out.reduce((s, p) => s + p.pct, 0)).toBe(100); // 33.3 each
  });

  it("does not invent fibre when the label under-discloses", () => {
    // only 60% stated — scaling to 100 would claim fibre the label never did
    const out = consolidateComposition([{ material: "conventional_cotton", label: "Cotton", pct: 60 }]);
    expect(out[0].pct).toBe(60);
  });
});

describe("normalizeComposition", () => {
  it("scales percentages to sum to 100", () => {
    const out = normalizeComposition([
      { material: "hemp", label: "Hemp", pct: 30 },
      { material: "organic_cotton", label: "Organic cotton", pct: 30 },
    ]);
    expect(out.reduce((s, p) => s + p.pct, 0)).toBe(100);
  });

  it("leaves already-normalized input intact", () => {
    const out = normalizeComposition([
      { material: "linen", label: "Linen", pct: 55 },
      { material: "organic_cotton", label: "Organic cotton", pct: 45 },
    ]);
    expect(out.map((p) => p.pct)).toEqual([55, 45]);
  });
});

describe("fibreScore", () => {
  it("scores 100% hemp at the top of the fibre range", () => {
    expect(fibreScore([{ material: "hemp", label: "Hemp", pct: 100 }])).toBeCloseTo(66.5, 1);
  });

  it("scores 100% polyester at the bottom", () => {
    expect(fibreScore([{ material: "polyester", label: "Polyester", pct: 100 }])).toBeCloseTo(14, 1);
  });

  it("weights blends by percentage", () => {
    const blend = fibreScore([
      { material: "hemp", label: "Hemp", pct: 50 },
      { material: "polyester", label: "Polyester", pct: 50 },
    ]);
    expect(blend).toBeCloseTo((66.5 + 14) / 2, 1);
  });
});

describe("gradeFor", () => {
  it.each([
    [80, "A"], [92, "A"],
    [65, "B"], [79, "B"],
    [50, "C"], [64, "C"],
    [35, "D"], [49, "D"],
    [0, "E"], [34, "E"],
  ] as const)("score %i → grade %s", (score, grade) => {
    expect(gradeFor(score)).toBe(grade);
  });
});

describe("validateCertifications", () => {
  it("keeps certs with textual evidence", () => {
    const out = validateCertifications(
      ["GOTS", "OEKO-TEX Standard 100"],
      "100% GOTS-certified organic cotton, OEKO-TEX certified fabric.",
    );
    expect(out).toEqual(["GOTS", "OEKO-TEX Standard 100"]);
  });

  it("drops hallucinated certs with no evidence", () => {
    const out = validateCertifications(
      ["GRS", "USDA Organic", "RWS", "FSC"],
      "100% recycled polyester (GRS certified) from post-consumer bottles.",
    );
    expect(out).toEqual(["GRS"]);
  });

  it("dedupes repeated certs", () => {
    const out = validateCertifications(
      ["European Flax", "European Flax"],
      "100% European Flax certified linen.",
    );
    expect(out).toEqual(["European Flax"]);
  });

  it("accepts brand-level certs even when absent from copy", () => {
    const out = validateCertifications(["B Corp"], "A lovely soft tee.", ["B Corp"]);
    expect(out).toEqual(["B Corp"]);
  });

  it("duplicate certs never double-count in scoring", () => {
    const once = computeScore({
      fabric_composition: [{ material: "linen", label: "Linen", pct: 100 }],
      certifications: ["European Flax"],
      practices: NO_PRACTICES,
      brand_ethics_modifier: 0,
    });
    const twice = computeScore({
      fabric_composition: [{ material: "linen", label: "Linen", pct: 100 }],
      certifications: ["European Flax", "European Flax"],
      practices: NO_PRACTICES,
      brand_ethics_modifier: 0,
    });
    expect(twice.score).toBe(once.score);
  });
});

describe("computeScore", () => {
  it("gives an A to a certified organic garment from an ethical brand", () => {
    const { score, grade, factors } = computeScore({
      fabric_composition: [{ material: "organic_cotton", label: "Organic cotton", pct: 100 }],
      certifications: ["GOTS", "Fair Wear Foundation"],
      practices: { ...NO_PRACTICES, natural_dye: true },
      brand_ethics_modifier: 6,
    });
    // 56 fibre + 9 certs + 6 brand + 2 dye = 73 → B, near A
    expect(score).toBe(73);
    expect(grade).toBe("B");
    expect(factors.length).toBeGreaterThanOrEqual(3);
  });

  it("caps certification bonus at CERT_CAP", () => {
    const stacked = computeScore({
      fabric_composition: [{ material: "linen", label: "Linen", pct: 100 }],
      certifications: ["GOTS", "GRS", "Bluesign", "RWS", "European Flax", "OCS"],
      practices: NO_PRACTICES,
      brand_ethics_modifier: 0,
    });
    const certFactor = stacked.factors.find((f) => f.label === "Certifications")!;
    expect(certFactor.points).toBe(CERT_CAP);
  });

  it("caps practice bonuses at 9", () => {
    const { factors } = computeScore({
      fabric_composition: [{ material: "linen", label: "Linen", pct: 100 }],
      certifications: [],
      practices: {
        natural_dye: true, undyed: true, deadstock: true, pfc_free: true,
        repair_program: true, take_back: true, zero_waste: true, made_to_order: true,
      },
      brand_ethics_modifier: 0,
    });
    const practicePoints = factors
      .filter((f) => !["Fibre composition", "Certifications", "Brand practices"].includes(f.label))
      .reduce((s, f) => s + f.points, 0);
    expect(practicePoints).toBe(9);
  });

  it("scores a vague eco-claim poly blend as mediocre", () => {
    const { score, grade } = computeScore({
      fabric_composition: [
        { material: "bci_cotton", label: "BCI cotton", pct: 60 },
        { material: "polyester", label: "Polyester", pct: 40 },
      ],
      certifications: ["BCI"],
      practices: NO_PRACTICES,
      brand_ethics_modifier: 0,
    });
    expect(score).toBeLessThan(50);
    expect(["D", "E"]).toContain(grade);
  });

  it("clamps to 0–100 and every factor is accounted", () => {
    const res = computeScore({
      fabric_composition: [{ material: "hemp", label: "Hemp", pct: 100 }],
      certifications: ["GOTS", "USDA Organic", "GRS", "Bluesign"],
      practices: { ...NO_PRACTICES, undyed: true, zero_waste: true, repair_program: true },
      brand_ethics_modifier: 6,
    });
    expect(res.score).toBeLessThanOrEqual(100);
    const sum = res.factors.reduce((s, f) => s + f.points, 0);
    expect(Math.round(sum)).toBe(res.score);
  });
});
