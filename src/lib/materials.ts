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
