import type {
  FabricPart,
  MaterialId,
  Practices,
  ScoreFactor,
  Sustainability,
} from "./types";

/**
 * Transparent sustainability rubric.
 *
 * score = fibre score (0–70, composition-weighted)
 *       + certification bonus (0–15, capped)
 *       + brand ethics modifier (0–6)
 *       + practice bonuses (0–9, capped)
 * clamped to 0–100. Every component is surfaced as a ScoreFactor so the
 * UI can show exactly why a garment scored what it did.
 */

/** Per-fibre environmental base score, 0–10. */
export const MATERIAL_SCORES: Record<MaterialId, number> = {
  hemp: 9.5,
  linen: 9,
  recycled_cotton: 8.5,
  tencel_lyocell: 8.5,
  recycled_wool: 8.5,
  organic_cotton: 8,
  modal: 7.5,
  cupro: 7.5,
  peace_silk: 7.5,
  merino_wool: 7,
  lambswool: 6.5,
  recycled_polyester: 6.5,
  recycled_polyamide: 6.5,
  virgin_wool: 5,
  bci_cotton: 4.5,
  viscose: 4.5,
  conventional_cotton: 3.5,
  polyester: 2,
  polyamide: 2,
  elastane: 2,
  other: 4,
};

export const MATERIAL_LABELS: Record<MaterialId, string> = {
  hemp: "Hemp",
  linen: "Linen",
  recycled_cotton: "Recycled cotton",
  tencel_lyocell: "TENCEL / Lyocell",
  recycled_wool: "Recycled wool",
  organic_cotton: "Organic cotton",
  modal: "Modal",
  cupro: "Cupro",
  peace_silk: "Peace silk",
  merino_wool: "Merino wool",
  lambswool: "Lambswool",
  recycled_polyester: "Recycled polyester",
  recycled_polyamide: "Recycled nylon",
  virgin_wool: "Virgin wool",
  bci_cotton: "BCI cotton",
  viscose: "Viscose",
  conventional_cotton: "Conventional cotton",
  polyester: "Polyester",
  polyamide: "Nylon",
  elastane: "Elastane",
  other: "Other fibre",
};

/** Why each fibre scores the way it does, used in fabric explainer UI. */
export const MATERIAL_NOTES: Record<MaterialId, string> = {
  hemp: "Rain-fed, pesticide-free, improves soil; among the lowest-impact fibres.",
  linen: "From flax, low water, whole plant used, biodegradable.",
  recycled_cotton: "Reuses existing fibre; near-zero new farming impact, but shorter fibres need blending.",
  tencel_lyocell: "Wood-pulp fibre made in a closed loop that recovers ~99% of solvents.",
  recycled_wool: "Reclaimed wool avoids new animal farming and landfill.",
  organic_cotton: "No synthetic pesticides/fertilisers; better soil and farmer health than conventional.",
  modal: "Beechwood cellulose fibre; efficient production, mostly closed-loop.",
  cupro: "Regenerated from cotton linter waste in a closed loop; a vegan silk alternative.",
  peace_silk: "Silk harvested without killing the silkworm; artisan, slow production.",
  merino_wool: "Renewable and durable; certified sources (RWS) address animal welfare.",
  lambswool: "Renewable and warm; impact depends on farm practices.",
  recycled_polyester: "Diverts plastic waste; no new oil, but still sheds microfibres.",
  recycled_polyamide: "Regenerated nylon (e.g. from fishing nets); big waste win, still synthetic.",
  virgin_wool: "Renewable but land- and methane-intensive without certification.",
  bci_cotton: "Better-than-conventional farming programme, but weaker than organic standards.",
  viscose: "Wood-based but often chemical-heavy processing unless certified.",
  conventional_cotton: "Very thirsty crop with heavy pesticide use.",
  polyester: "Fossil-fuel based, energy-intensive, sheds microplastics.",
  polyamide: "Fossil-fuel based nylon; durable but high-impact to make.",
  elastane: "Fossil-fuel based stretch fibre; complicates recycling.",
  other: "Impact varies by fibre.",
};

/** Certification bonuses (points). Sum capped at CERT_CAP. */
export const CERT_POINTS: Record<string, number> = {
  GOTS: 6,
  "USDA Organic": 4,
  GRS: 4,
  Bluesign: 4,
  RWS: 3,
  "European Flax": 3,
  OCS: 3,
  "B Corp": 3,
  "Fair Wear Foundation": 3,
  "OEKO-TEX Standard 100": 2,
  SA8000: 2,
  FSC: 2,
  BCI: 1,
  "1% for the Planet": 1,
};

export const CERT_CAP = 15;
export const PRACTICE_CAP = 9;

/**
 * Textual evidence patterns per certification. A cert claimed by the
 * extraction agent only survives validation if the product copy (or the
 * brand's own certification list) actually mentions it, LLM extractors
 * occasionally hallucinate certifications, and unverified certs must never
 * inflate a score.
 */
export const CERT_EVIDENCE: Record<string, RegExp> = {
  GOTS: /gots/i,
  "USDA Organic": /usda/i,
  GRS: /\bgrs\b/i,
  Bluesign: /bluesign/i,
  RWS: /\brws\b|responsible wool/i,
  "European Flax": /european flax/i,
  OCS: /\bocs\b/i,
  "B Corp": /b[- ]corp/i,
  "Fair Wear Foundation": /fair wear/i,
  "OEKO-TEX Standard 100": /oeko[- ]?tex/i,
  SA8000: /sa8000/i,
  FSC: /\bfsc\b/i,
  BCI: /\bbci\b|better cotton/i,
  "1% for the Planet": /1% for the planet/i,
};

/** Dedupe + drop certifications with no textual evidence. */
export function validateCertifications(
  certs: string[],
  rawText: string,
  brandCerts: string[] = [],
): string[] {
  const out: string[] = [];
  for (const cert of certs) {
    if (out.includes(cert)) continue; // dedupe
    const pattern = CERT_EVIDENCE[cert];
    if (!pattern) continue; // unknown cert name
    if (pattern.test(rawText) || brandCerts.includes(cert)) out.push(cert);
  }
  return out;
}

const PRACTICE_POINTS: Array<{
  key: keyof Practices;
  points: number;
  label: string;
  detail: string;
}> = [
  { key: "deadstock", points: 6, label: "Deadstock / rescued fabric", detail: "Uses existing fabric, zero new fibre production for this piece." },
  { key: "undyed", points: 3, label: "Undyed", detail: "No dye chemistry or dye wastewater at all." },
  { key: "natural_dye", points: 2, label: "Natural dyes", detail: "Plant/mineral dyes avoid synthetic dye effluent." },
  { key: "repair_program", points: 2, label: "Repair programme", detail: "Brand repairs the garment, extending its life." },
  { key: "take_back", points: 2, label: "Take-back recycling", detail: "Brand takes the garment back for recycling at end of life." },
  { key: "zero_waste", points: 1, label: "Zero-waste cutting", detail: "Pattern layout designed to leave no offcut waste." },
  { key: "made_to_order", points: 1, label: "Made to order", detail: "Nothing is produced unless sold, no overstock landfill." },
  { key: "pfc_free", points: 1, label: "PFC-free finish", detail: "Water repellency without persistent 'forever chemicals'." },
];

export function normalizeComposition(parts: FabricPart[]): FabricPart[] {
  const total = parts.reduce((s, p) => s + p.pct, 0);
  if (total <= 0) return parts;
  return parts.map((p) => ({ ...p, pct: Math.round((p.pct / total) * 100) }));
}

/**
 * Turn a raw extracted composition into one garment's worth of fibre.
 *
 * Labels list multi-part garments per component, "Shell: 100% Cotton,
 * Sleeve Lining: 100% Polyester, Collar: 100% Cotton", so the parts sum to
 * n×100. `fibreScore` normalises internally so the score stays right, but
 * `fibreMark`/`oilDerivedPct` read the percentages literally and report
 * nonsense like "200% plastic". Merge duplicate materials, scale a
 * multi-part total back to a single garment, and clean the per-part label
 * prefixes so the composition reads like a label, not a parts list.
 *
 * A total under 90 is left untouched: the disclosure is incomplete, and
 * scaling it to 100 would invent fibre the label never claimed.
 */
export function consolidateComposition(parts: FabricPart[]): FabricPart[] {
  if (parts.length === 0) return parts;

  const cleanLabel = (label: string, material: MaterialId): string => {
    const stripped = label
      // drop component prefixes: "Shell: ", "Sleeve Lining/Pocket Lining: "
      .replace(/^[^:]{1,48}:\s*/, "")
      .replace(/\d{1,3}\s*%\s*/g, "") // drop percentages embedded in the label
      .trim();
    return stripped || MATERIAL_LABELS[material];
  };

  const merged = new Map<MaterialId, FabricPart>();
  for (const p of parts) {
    if (p.pct <= 0) continue;
    const prev = merged.get(p.material);
    if (prev) prev.pct += p.pct;
    else merged.set(p.material, { material: p.material, label: cleanLabel(p.label, p.material), pct: p.pct });
  }

  const out = [...merged.values()];
  const total = out.reduce((s, p) => s + p.pct, 0);
  if (total <= 0 || total < 90) return out; // incomplete label, don't invent fibre

  const scaled = out.map((p) => ({ ...p, pct: Math.round((p.pct / total) * 100) }));
  // absorb rounding drift into the dominant fibre so it sums to exactly 100
  const drift = 100 - scaled.reduce((s, p) => s + p.pct, 0);
  if (drift !== 0) {
    const dominant = scaled.reduce((a, b) => (b.pct > a.pct ? b : a));
    dominant.pct += drift;
  }
  return scaled.sort((a, b) => b.pct - a.pct);
}

export function fibreScore(parts: FabricPart[]): number {
  const normalized = normalizeComposition(parts);
  const weighted = normalized.reduce(
    (sum, p) => sum + (MATERIAL_SCORES[p.material] ?? MATERIAL_SCORES.other) * (p.pct / 100),
    0,
  );
  return Math.round(weighted * 7 * 10) / 10; // 0–70, one decimal
}

export function gradeFor(score: number): Sustainability["grade"] {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "E";
}

export interface ScoreInput {
  fabric_composition: FabricPart[];
  certifications: string[];
  practices: Practices;
  brand_ethics_modifier: number;
}

export function computeScore(input: ScoreInput): {
  score: number;
  grade: Sustainability["grade"];
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [];

  const fibre = fibreScore(input.fabric_composition);
  const topFibres = normalizeComposition(input.fabric_composition)
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((p) => `${p.pct}% ${MATERIAL_LABELS[p.material] ?? p.label}`)
    .join(", ");
  factors.push({
    label: "Fibre composition",
    points: fibre,
    detail: `${topFibres}, weighted fibre impact (max 70).`,
  });

  let certTotal = 0;
  const recognized: string[] = [];
  for (const cert of [...new Set(input.certifications)]) {
    const pts = CERT_POINTS[cert];
    if (pts) {
      certTotal += pts;
      recognized.push(`${cert} (+${pts})`);
    }
  }
  certTotal = Math.min(certTotal, CERT_CAP);
  if (recognized.length > 0) {
    factors.push({
      label: "Certifications",
      points: certTotal,
      detail: `${recognized.join(", ")}${certTotal === CERT_CAP ? ", capped at 15" : ""}.`,
    });
  }

  if (input.brand_ethics_modifier !== 0) {
    factors.push({
      label: "Brand practices",
      points: input.brand_ethics_modifier,
      detail: "Brand-level transparency, labour and supply-chain record.",
    });
  }

  let practiceTotal = 0;
  for (const p of PRACTICE_POINTS) {
    if (input.practices[p.key]) {
      const usable = Math.min(p.points, PRACTICE_CAP - practiceTotal);
      if (usable <= 0) break;
      practiceTotal += usable;
      factors.push({ label: p.label, points: usable, detail: p.detail });
    }
  }

  const raw = fibre + certTotal + input.brand_ethics_modifier + practiceTotal;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return { score, grade: gradeFor(score), factors };
}
