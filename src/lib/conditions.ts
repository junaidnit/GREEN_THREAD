import type { FabricPart, MaterialId } from "./types";

/**
 * SKIN-CONDITION FILTERS, one shareable link per condition, backed by an
 * explicit, auditable per-fibre rule (never a fuzzy "natural = safe"
 * shortcut, which would be WRONG: wool is a classic eczema irritant despite
 * being a natural fibre, so a naive natural/synthetic split would recommend
 * wool jumpers to eczema sufferers).
 *
 * Each rule states exactly which fibres are excluded and why, cites the
 * clinical guidance it's grounded in, and is unit-tested (tests/unit/
 * conditions.test.ts) to prove the exclusion actually holds against real
 * products, including the case where a fibre is excluded for ONE condition
 * but fine for another (wool: out for eczema, fine for dye-allergy).
 *
 * This is informational filtering, not medical advice, every condition
 * page carries a clear disclaimer and a "check with your dermatologist"
 * pointer, and we only ever INCLUDE a product when we are confident it
 * meets the rule; ambiguous data is excluded rather than guessed at.
 */

export type ConditionSlug =
  | "eczema"
  | "synthetic-fibre-allergy"
  | "psoriasis"
  | "night-sweats";

export interface ConditionRule {
  slug: ConditionSlug;
  name: string;
  /** Short clinical name shown in the eyebrow. */
  clinicalName: string;
  summary: string;
  /** Why this condition needs THIS rule, in plain language. */
  guidance: string[];
  /** Fibres this rule excludes at ANY percentage, with the reason. */
  excludes: Array<{ material: MaterialId; reason: string }>;
  /** Set of materials allowed to make up the remaining composition. */
  allow: Set<MaterialId>;
  sources: Array<{ label: string; note: string }>;
}

const ALL_SYNTHETIC: MaterialId[] = [
  "polyester",
  "recycled_polyester",
  "polyamide",
  "recycled_polyamide",
  "elastane",
];

const ALL_WOOL: MaterialId[] = ["merino_wool", "lambswool", "recycled_wool", "virgin_wool"];

const SOFT_CELLULOSIC: MaterialId[] = [
  "organic_cotton",
  "recycled_cotton",
  "conventional_cotton",
  "bci_cotton",
  "tencel_lyocell",
  "modal",
  "cupro",
  "viscose",
  "peace_silk",
  "linen",
  "hemp",
];

export const CONDITIONS: Record<ConditionSlug, ConditionRule> = {
  eczema: {
    slug: "eczema",
    name: "Eczema-friendly",
    clinicalName: "Atopic dermatitis (eczema)",
    summary:
      "Soft, breathable fabrics that dermatology guidance recommends for eczema-prone skin, no wool, no synthetics.",
    guidance: [
      "Wool and coarse animal fibres are one of the most commonly cited eczema triggers, even fine merino can irritate compromised skin, so every wool item is excluded, however 'natural' it is.",
      "Synthetic fibres (polyester, nylon/polyamide, elastane) trap heat and sweat against the skin and can carry disperse dyes and formaldehyde-based easy-care finishes, both recognised causes of contact irritation, excluded entirely, including recycled synthetics.",
      "What's left: soft cotton, TENCEL/lyocell, modal, linen, hemp and silk, the fabrics eczema guidance consistently recommends.",
    ],
    excludes: [
      ...ALL_WOOL.map((material) => ({
        material,
        reason: "Wool is a well-documented eczema irritant, even in fine/merino weights.",
      })),
      ...ALL_SYNTHETIC.map((material) => ({
        material,
        reason: "Synthetics trap heat/sweat and can carry irritant dyes or finishes.",
      })),
    ],
    allow: new Set(SOFT_CELLULOSIC),
    sources: [
      { label: "National Eczema Association", note: "recommends 100% cotton, silk or bamboo/TENCEL; advises avoiding wool and synthetic fabrics" },
      { label: "NHS eczema self-care guidance", note: "advises soft, breathable fabrics and avoiding wool next to skin" },
    ],
  },
  "synthetic-fibre-allergy": {
    slug: "synthetic-fibre-allergy",
    name: "Synthetic-fibre & disperse-dye safe",
    clinicalName: "Textile (allergic) contact dermatitis",
    summary:
      "Zero synthetic content, for the specific, diagnosed allergy to disperse dyes and resin finishes used almost exclusively on polyester and nylon.",
    guidance: [
      "Disperse dyes (used to colour polyester and nylon) and formaldehyde-resin 'easy-care' finishes are among the most common causes of diagnosed textile contact allergy, and they're not used on natural or regenerated-cellulosic fibres.",
      "Unlike eczema, this isn't about softness: wool, cotton, linen, silk and TENCEL are all fine here, because the allergen is the synthetic-fibre dye/finish, not the fibre's texture.",
      "The rule is strict, zero percent synthetic content, including recycled polyester/nylon, since the allergen is chemical, not about virgin-vs-recycled sourcing.",
    ],
    excludes: ALL_SYNTHETIC.map((material) => ({
      material,
      reason: "Disperse dyes and easy-care resin finishes are applied almost exclusively to synthetic fibres.",
    })),
    allow: new Set([...SOFT_CELLULOSIC, ...ALL_WOOL]),
    sources: [
      { label: "Contact Dermatitis (clinical literature)", note: "identifies disperse dyes as a leading textile allergen, near-exclusively on polyester/nylon" },
      { label: "American Contact Dermatitis Society", note: "lists formaldehyde-resin finishes (permanent-press/easy-care) as a recognised textile allergen" },
    ],
  },
  psoriasis: {
    slug: "psoriasis",
    name: "Psoriasis-friendly",
    clinicalName: "Psoriasis (plaque)",
    summary:
      "Smooth, breathable fabrics that don't abrade plaques or trap heat. No wool, no synthetics, nothing scratchy against broken skin.",
    guidance: [
      "Friction is the specific problem here. Physical irritation of skin can provoke new plaques where the skin was rubbed, which is why coarse and scratchy fibres matter more for psoriasis than for most conditions.",
      "Wool is excluded at any percentage. Even fine merino has a scale structure that abrades, and plaque skin is already compromised.",
      "Synthetics are excluded too: they trap heat and sweat against skin that is often already inflamed, and they carry the same dye and easy-care finishes flagged elsewhere on this site.",
      "What remains is what dermatology guidance keeps pointing at: soft cotton, silk, TENCEL, modal, and loose linen.",
    ],
    excludes: [
      ...ALL_WOOL.map((material) => ({
        material,
        reason: "Wool fibres abrade plaques, and skin friction can provoke new ones.",
      })),
      ...ALL_SYNTHETIC.map((material) => ({
        material,
        reason: "Synthetics trap heat and sweat against inflamed skin, and carry irritant finishes.",
      })),
    ],
    allow: new Set(SOFT_CELLULOSIC),
    sources: [
      { label: "NHS psoriasis self-care guidance", note: "advises avoiding skin injury and irritation, which includes friction from clothing" },
      { label: "Psoriasis Association", note: "advises loose, soft, breathable clothing and avoiding wool next to the skin" },
    ],
  },
  "night-sweats": {
    slug: "night-sweats",
    name: "Night sweats & hot sleepers",
    clinicalName: "Thermoregulation (menopause, hot sleepers)",
    summary:
      "Fibres that move heat and moisture away instead of holding them. For anyone who wakes up hot, including through menopause.",
    guidance: [
      "This one is about comfort, not a diagnosis. It is the only edit here that isn't grounded in a clinical exclusion, and we would rather say so than dress it up.",
      "Synthetics are excluded because they hold heat and moisture against skin. That is precisely the wrong behaviour at 3am, and 'cooling' polyester sleepwear is marketed heavily despite it.",
      "Wool stays IN, unlike the eczema and psoriasis edits. Merino buffers humidity and regulates temperature, which is why it works for a temperature surge even though it is wrong for reactive skin.",
      "Linen, TENCEL and merino do the real work here: open weave, high moisture regain, heat carried away rather than trapped.",
    ],
    excludes: ALL_SYNTHETIC.map((material) => ({
      material,
      reason: "Synthetics hold heat and sweat against the skin rather than moving it away.",
    })),
    allow: new Set([...SOFT_CELLULOSIC, ...ALL_WOOL]),
    sources: [
      { label: "NHS menopause guidance", note: "advises natural fabrics and layers for hot flushes and night sweats" },
      { label: "Sleep Foundation", note: "recommends breathable, moisture-moving bedding and sleepwear for hot sleepers" },
    ],
  },
};

export const CONDITION_SLUGS = Object.keys(CONDITIONS) as ConditionSlug[];

/**
 * Does this product's disclosed composition satisfy the condition's rule?
 * Conservative by construction: a product is safe only if EVERY disclosed
 * fibre is in the allow-set for that condition. Any excluded fibre at any
 * percentage, or any fibre the rule doesn't recognise, disqualifies it.
 * We never guess at undisclosed or ambiguous composition.
 */
export function isConditionSafe(composition: FabricPart[], slug: ConditionSlug): boolean {
  if (composition.length === 0) return false;
  const rule = CONDITIONS[slug];
  return composition.every((f) => rule.allow.has(f.material));
}

/** The specific excluded fibres present in this product, for a "why not" explanation. */
export function excludedFibresIn(composition: FabricPart[], slug: ConditionSlug): FabricPart[] {
  const rule = CONDITIONS[slug];
  return composition.filter((f) => !rule.allow.has(f.material));
}
