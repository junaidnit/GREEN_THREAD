import { describe, expect, it } from "vitest";
import { isConditionSafe, excludedFibresIn, CONDITIONS, CONDITION_SLUGS } from "@/lib/conditions";
import type { FabricPart } from "@/lib/types";

const part = (material: FabricPart["material"], pct: number, label = material): FabricPart => ({
  material,
  label,
  pct,
});

describe("conditions registry", () => {
  it("has both required condition links", () => {
    expect(CONDITION_SLUGS).toContain("eczema");
    expect(CONDITION_SLUGS).toContain("synthetic-fibre-allergy");
  });
});

describe("eczema — soft fibres only, wool and synthetics both excluded", () => {
  it("includes pure organic cotton, TENCEL, linen, hemp, silk", () => {
    for (const m of ["organic_cotton", "tencel_lyocell", "linen", "hemp", "peace_silk", "modal", "cupro", "viscose"] as const) {
      expect(isConditionSafe([part(m, 100)], "eczema")).toBe(true);
    }
  });

  it("EXCLUDES wool at any percentage — the critical nuance a naive 'natural=safe' rule would get wrong", () => {
    for (const wool of ["merino_wool", "lambswool", "recycled_wool", "virgin_wool"] as const) {
      expect(isConditionSafe([part(wool, 100)], "eczema")).toBe(false);
      expect(isConditionSafe([part("organic_cotton", 95), part(wool, 5)], "eczema")).toBe(false);
    }
  });

  it("excludes any synthetic content, even a small stretch %", () => {
    expect(isConditionSafe([part("organic_cotton", 98), part("elastane", 2)], "eczema")).toBe(false);
    expect(isConditionSafe([part("polyester", 100)], "eczema")).toBe(false);
    expect(isConditionSafe([part("recycled_polyester", 100)], "eczema")).toBe(false);
  });

  it("explains exactly which fibre disqualified a product", () => {
    const excluded = excludedFibresIn(
      [part("organic_cotton", 70), part("virgin_wool", 30)],
      "eczema",
    );
    expect(excluded).toHaveLength(1);
    expect(excluded[0].material).toBe("virgin_wool");
  });
});

describe("synthetic-fibre-allergy — zero synthetic, but wool is FINE here", () => {
  it("includes pure wool, cotton, linen, silk", () => {
    for (const m of ["virgin_wool", "merino_wool", "organic_cotton", "linen", "peace_silk"] as const) {
      expect(isConditionSafe([part(m, 100)], "synthetic-fibre-allergy")).toBe(true);
    }
  });

  it("proves the two conditions disagree correctly: wool is safe here, unsafe for eczema", () => {
    const woolOnly = [part("virgin_wool" as const, 100)];
    expect(isConditionSafe(woolOnly, "synthetic-fibre-allergy")).toBe(true);
    expect(isConditionSafe(woolOnly, "eczema")).toBe(false);
  });

  it("excludes ANY synthetic, including recycled and trace elastane", () => {
    expect(isConditionSafe([part("polyester", 100)], "synthetic-fibre-allergy")).toBe(false);
    expect(isConditionSafe([part("recycled_polyester", 100)], "synthetic-fibre-allergy")).toBe(false);
    expect(isConditionSafe([part("polyamide", 100)], "synthetic-fibre-allergy")).toBe(false);
    expect(isConditionSafe([part("organic_cotton", 97), part("elastane", 3)], "synthetic-fibre-allergy")).toBe(false);
  });
});

describe("both conditions — conservative on unknowns", () => {
  it("never marks an item with no disclosed composition as safe", () => {
    expect(isConditionSafe([], "eczema")).toBe(false);
    expect(isConditionSafe([], "synthetic-fibre-allergy")).toBe(false);
  });

  it("every excludes[] entry is actually absent from that condition's allow set", () => {
    for (const slug of CONDITION_SLUGS) {
      const rule = CONDITIONS[slug];
      for (const { material } of rule.excludes) {
        expect(rule.allow.has(material)).toBe(false);
      }
    }
  });
});
