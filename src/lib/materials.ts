import type { MaterialId } from "./types";

/** Natural / regenerated / synthetic classification for the fabric filter. */
export type FibreClass = "natural" | "regenerated" | "synthetic";

export const FIBRE_CLASS: Record<MaterialId, FibreClass> = {
  organic_cotton: "natural",
  recycled_cotton: "natural",
  conventional_cotton: "natural",
  bci_cotton: "natural",
  linen: "natural",
  hemp: "natural",
  merino_wool: "natural",
  lambswool: "natural",
  recycled_wool: "natural",
  virgin_wool: "natural",
  peace_silk: "natural",
  tencel_lyocell: "regenerated",
  modal: "regenerated",
  cupro: "regenerated",
  viscose: "regenerated",
  recycled_polyester: "synthetic",
  polyester: "synthetic",
  recycled_polyamide: "synthetic",
  polyamide: "synthetic",
  elastane: "synthetic",
  other: "synthetic",
};

/**
 * Research-style facts shown in the fabric filter and product pages.
 * Punchy stat + attribution, the way a broadsheet style guide would put it.
 * Figures are widely-cited industry estimates — sources named for credibility.
 */
export interface MaterialFact {
  stat: string;
  detail: string;
  source: string;
}

/* ── natural-fibre-first: the platform's core metric ─────────────────────
   Purist stance: recycled polyester/nylon are still oil-derived plastics,
   so they count as synthetic. Regenerated cellulosics (TENCEL, modal,
   cupro, viscose) are plant-derived — plastic-free, but not "natural". */

/** % of the garment that is oil-derived plastic (incl. recycled synthetics). */
export function oilDerivedPct(composition: Array<{ material: MaterialId; pct: number }>): number {
  return Math.round(
    composition
      .filter((c) => FIBRE_CLASS[c.material] === "synthetic")
      .reduce((s, c) => s + c.pct, 0),
  );
}

/** % grown fibre (plant/animal): cotton, linen, hemp, wool, silk families. */
export function naturalPct(composition: Array<{ material: MaterialId; pct: number }>): number {
  return Math.round(
    composition
      .filter((c) => FIBRE_CLASS[c.material] === "natural")
      .reduce((s, c) => s + c.pct, 0),
  );
}

export interface FibreMark {
  label: string;
  tone: "natural" | "plastic-free" | "plastic";
  /** plastic percentage, for sorting/filtering */
  plastic: number;
}

/** The one mark every card carries — the thesis in two words. */
export function fibreMark(composition: Array<{ material: MaterialId; pct: number }>): FibreMark {
  const plastic = oilDerivedPct(composition);
  if (plastic === 0) {
    return naturalPct(composition) === 100
      ? { label: "100% natural", tone: "natural", plastic }
      : { label: "Plastic-free", tone: "plastic-free", plastic };
  }
  return { label: `${plastic}% plastic`, tone: "plastic", plastic };
}

/** Fibre words shoppers read in product names, mapped to material ids. */
const NAME_FIBRES: Array<{ re: RegExp; label: string; materials: MaterialId[] }> = [
  { re: /\blinen\b/i, label: "linen", materials: ["linen"] },
  { re: /\bhemp\b/i, label: "hemp", materials: ["hemp"] },
  { re: /\bcotton\b/i, label: "cotton", materials: ["organic_cotton", "recycled_cotton", "conventional_cotton", "bci_cotton"] },
  { re: /\bwool\b|\bmerino\b|\blambswool\b/i, label: "wool", materials: ["merino_wool", "lambswool", "recycled_wool", "virgin_wool"] },
  { re: /\bsilk\b/i, label: "silk", materials: ["peace_silk"] },
  { re: /\btencel\b|\blyocell\b/i, label: "TENCEL", materials: ["tencel_lyocell"] },
  { re: /\bmodal\b/i, label: "modal", materials: ["modal"] },
];

export interface MisleadingName {
  fibre: string;
  actualPct: number;
}

/**
 * The "Linen blend (90% polyester)" detector: a product named after a fibre
 * it contains less than half of. The platform's flagship transparency call.
 */
export function misleadingName(
  title: string,
  composition: Array<{ material: MaterialId; pct: number }>,
): MisleadingName | null {
  for (const f of NAME_FIBRES) {
    if (!f.re.test(title)) continue;
    const actual = Math.round(
      composition.filter((c) => f.materials.includes(c.material)).reduce((s, c) => s + c.pct, 0),
    );
    if (actual < 50) return { fibre: f.label, actualPct: actual };
  }
  return null;
}

/** Certification explainers — hover-cards, same spirit as fibre facts. */
export const CERT_INFO: Record<string, string> = {
  GOTS: "Global Organic Textile Standard — organic fibre plus environmental and social criteria through the whole supply chain. The gold standard for organic textiles.",
  "USDA Organic": "US federal organic certification — no synthetic pesticides or fertilisers in fibre farming.",
  GRS: "Global Recycled Standard — verifies recycled content and responsible production, with chain-of-custody tracking.",
  Bluesign: "Audits chemistry, water and energy at the mill level — screens out harmful substances before they enter production.",
  RWS: "Responsible Wool Standard — animal welfare (no mulesing) and land management, traceable to the farm.",
  "European Flax": "Guarantees European-grown flax: rain-fed, zero irrigation, GMO-free.",
  OCS: "Organic Content Standard — verifies the organic fibre percentage in the final product.",
  "B Corp": "Whole-company certification for social and environmental performance, not just the product.",
  "Fair Wear Foundation": "Independent audits of working conditions and wages in garment factories.",
  "OEKO-TEX Standard 100": "Every component tested against a list of harmful substances — about human safety, not farming.",
  SA8000: "Social accountability standard: no child labour, safe conditions, living wages.",
  FSC: "Forest Stewardship Council — wood pulp (for TENCEL/viscose) from responsibly managed forests.",
  BCI: "Better Cotton Initiative — mass-market programme improving conventional farming. Weaker than organic; fibre is not traceable to your garment.",
  "1% for the Planet": "Brand donates 1% of revenue to environmental causes.",
};

/** One-liner fit guides for tooltip chips. */
export const FIT_INFO: Record<string, string> = {
  Regular: "True to size, classic cut",
  Slim: "Closer to the body — size up if between sizes",
  Relaxed: "Roomy through body, standard shoulders",
  Oversized: "Intentionally big — drop shoulders, longer body",
  Wide: "Wide through the leg from hip to hem",
};

/** Approximate garment fibre weight (grams) by category — for impact equivalents. */
const CATEGORY_WEIGHT_G: Record<string, number> = {
  "t-shirts": 180, shirts: 250, jeans: 650, trousers: 450, dresses: 350,
  skirts: 300, knitwear: 400, hoodies: 500, activewear: 200, outerwear: 700,
  accessories: 120,
};

export interface ImpactEquivalent {
  icon: "bottle" | "water" | "wear";
  headline: string;
  detail: string;
}

/**
 * Tangible impact equivalents, computed from composition. Deliberately
 * conservative and phrased as estimates — trust over theatre.
 * ~25g PET per 500ml bottle; conventional cotton ≈ 10,000 L water/kg vs
 * organic ≈ 900 L/kg (widely cited Textile Exchange / WWF figures).
 */
export function impactEquivalents(
  category: string,
  composition: Array<{ material: MaterialId; pct: number }>,
): ImpactEquivalent[] {
  const weight = CATEGORY_WEIGHT_G[category] ?? 300;
  const out: ImpactEquivalent[] = [];

  const rpesPct = composition.find((c) => c.material === "recycled_polyester")?.pct ?? 0;
  if (rpesPct >= 30) {
    const bottles = Math.max(1, Math.round((weight * (rpesPct / 100)) / 25));
    out.push({
      icon: "bottle",
      headline: `≈ ${bottles} plastic bottles diverted`,
      detail: "Estimated from the recycled-polyester share of this garment's fibre weight.",
    });
  }

  const lowWaterPct = composition
    .filter((c) => ["organic_cotton", "linen", "hemp", "recycled_cotton"].includes(c.material))
    .reduce((s, c) => s + c.pct, 0);
  if (lowWaterPct >= 50) {
    const litres = Math.round(((weight * (lowWaterPct / 100)) / 1000) * 9100);
    out.push({
      icon: "water",
      headline: `≈ ${litres.toLocaleString("en-GB")} L water saved`,
      detail: "Versus the same weight of conventional cotton fibre (industry LCA averages).",
    });
  }

  return out;
}

/** Rough expected wears by dominant fibre — powers price-per-wear. */
const WEARS: Partial<Record<MaterialId, number>> = {
  hemp: 200, linen: 150, organic_cotton: 110, recycled_cotton: 90,
  conventional_cotton: 90, bci_cotton: 90, merino_wool: 150, lambswool: 120,
  recycled_wool: 120, virgin_wool: 140, tencel_lyocell: 100, modal: 90,
  cupro: 80, peace_silk: 80, viscose: 60, recycled_polyester: 100,
  polyester: 80, recycled_polyamide: 110, polyamide: 110, elastane: 60,
};

export function estimatedWears(composition: Array<{ material: MaterialId; pct: number }>): number {
  const dominant = [...composition].sort((a, b) => b.pct - a.pct)[0];
  return WEARS[dominant?.material ?? "other"] ?? 80;
}

/** Does this garment shed microfibres in the wash? (≥40% synthetic) */
export function sheddingRisk(composition: Array<{ material: MaterialId; pct: number }>): boolean {
  const syntheticPct = composition
    .filter((c) => FIBRE_CLASS[c.material] === "synthetic" && c.material !== "elastane")
    .reduce((s, c) => s + c.pct, 0);
  return syntheticPct >= 40;
}

export const MATERIAL_FACTS: Partial<Record<MaterialId, MaterialFact>> = {
  linen: {
    stat: "≈ 6.4× less water than cotton",
    detail: "Flax is largely rain-fed and the whole plant is used — Europe grows 80% of the world's supply.",
    source: "European Confederation of Flax & Hemp",
  },
  hemp: {
    stat: "Zero pesticides, rain-fed",
    detail: "Hemp yields more than twice the fibre per hectare of cotton and returns nutrients to the soil.",
    source: "Textile Exchange fibre report",
  },
  organic_cotton: {
    stat: "−91% freshwater use vs conventional",
    detail: "Grown without synthetic pesticides; healthier soil and farm workers.",
    source: "Textile Exchange LCA",
  },
  recycled_cotton: {
    stat: "Near-zero new farming impact",
    detail: "Reuses existing fibre from offcuts and worn garments; blended for strength.",
    source: "Ellen MacArthur Foundation",
  },
  tencel_lyocell: {
    stat: "99% of solvents recovered",
    detail: "Made from certified eucalyptus in a closed loop; fully biodegradable.",
    source: "Lenzing sustainability report",
  },
  modal: {
    stat: "Beechwood, mostly closed-loop",
    detail: "Silky-soft regenerated fibre with far lower water use than cotton.",
    source: "Lenzing sustainability report",
  },
  cupro: {
    stat: "Made from cotton waste",
    detail: "A vegan silk alternative regenerated from cotton linter in a closed loop.",
    source: "Asahi Kasei (Bemberg)",
  },
  merino_wool: {
    stat: "Renewable & biodegradable",
    detail: "RWS certification adds animal-welfare and land-management audits.",
    source: "Responsible Wool Standard",
  },
  recycled_wool: {
    stat: "−90%+ impact vs virgin wool",
    detail: "Reclaimed fleece keeps quality garments in circulation for decades.",
    source: "Prato textile district studies",
  },
  peace_silk: {
    stat: "No moths harmed",
    detail: "Cocoons are harvested only after the moth emerges naturally.",
    source: "Ahimsa silk standards",
  },
  recycled_polyester: {
    stat: "≈ 6 bottles per tee, −59% energy",
    detail: "Diverts plastic waste, but still sheds microfibres in the wash.",
    source: "WRAP UK / Textile Exchange",
  },
  recycled_polyamide: {
    stat: "Regenerated from fishing nets",
    detail: "ECONYL-type nylon cuts new fossil-fuel use; still synthetic at end of life.",
    source: "Aquafil ECONYL programme",
  },
  conventional_cotton: {
    stat: "≈ 2,700 L water per t-shirt",
    detail: "One of the thirstiest crops, with heavy pesticide use.",
    source: "WWF water footprint studies",
  },
  polyester: {
    stat: "≈ 70m barrels of oil a year",
    detail: "Fossil-based and the largest source of textile microplastics.",
    source: "Changing Markets Foundation",
  },
  viscose: {
    stat: "Wood-based, chemistry-heavy",
    detail: "Fine when certified (FSC/closed-loop); otherwise linked to deforestation.",
    source: "Canopy Planet",
  },
};
