import { generateObject } from "ai";
import { z } from "zod";
import { anthropic } from "./env";
import { computeScore, consolidateComposition } from "./scoring";
import type { Pattern } from "./garment";
import type { Practices, ScoreFactor } from "./types";

/**
 * Shared extraction agent: turns scraped product-page text into a structured
 * fibre composition + honest sustainability read. Used by both the Fabric
 * Check page (server fetches the URL itself) and the browser extension
 * (the user's own browser has already rendered the page, so it scrapes the
 * DOM directly and skips the fetch, sidesteps sites that 403 server fetches).
 */

const materialEnum = z.enum([
  "organic_cotton", "recycled_cotton", "conventional_cotton", "bci_cotton",
  "linen", "hemp", "tencel_lyocell", "modal", "cupro", "viscose",
  "merino_wool", "lambswool", "recycled_wool", "virgin_wool", "peace_silk",
  "recycled_polyester", "polyester", "recycled_polyamide", "polyamide",
  "elastane", "other",
]);

export const CANONICAL_CERTS = [
  "GOTS", "USDA Organic", "GRS", "Bluesign", "RWS", "European Flax", "OCS",
  "B Corp", "Fair Wear Foundation", "OEKO-TEX Standard 100", "SA8000", "FSC",
  "BCI", "1% for the Planet",
] as const;

const extractionSchema = z.object({
  found_composition: z.boolean().describe("True only if the page states an actual fibre composition (e.g. '80% cotton, 20% polyester')."),
  product_name: z.string().describe("The product's name as best determined from the page."),
  fabric_composition: z.array(z.object({
    material: materialEnum,
    label: z.string(),
    pct: z.number().min(0).max(100),
  })).describe("Fibre breakdown if stated. Empty array when found_composition is false. Never guess percentages."),
  certifications: z.array(z.enum(CANONICAL_CERTS)).describe("Only certifications explicitly stated on the page."),
  practices: z.object({
    natural_dye: z.boolean(), undyed: z.boolean(), deadstock: z.boolean(),
    pfc_free: z.boolean(), repair_program: z.boolean(), take_back: z.boolean(),
    zero_waste: z.boolean(), made_to_order: z.boolean(),
  }),
  greenwash_flags: z.array(z.string()).describe("Vague eco-claims on the page with no certification or verifiable fact behind them. Quote briefly."),
  explanation: z.string().describe("2-3 honest sentences: what the page reveals (or fails to reveal) about this garment's sustainability."),
  price_text: z.string().describe("Price as shown on the page, e.g. '£29.99', or empty string if not found."),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

export interface PageSignal {
  title: string;
  siteName: string;
  /** Composition-biased page text: description + JSON-LD + the window around fibre keywords. */
  text: string;
}

export async function extractComposition(signal: PageSignal): Promise<ExtractionResult> {
  const { object } = await generateObject({
    // Haiku, not Sonnet: this is a bounded extraction from ≤7k characters of
    // text that already states the composition, the hard part is refusing to
    // invent, not reasoning. Sonnet averaged ~7.3s, which reads as broken in
    // a panel the user is watching. Measured on the same pages after the
    // switch: see the timing note in the extension README.
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: extractionSchema,
    system:
      "You are a textile sustainability analyst. Extract structured data from scraped product-page content precisely. " +
      "Never invent fibres, percentages or certifications not present in the text. If no composition is stated, say so " +
      "(found_composition=false), an honest 'not disclosed' matters more than a guess. " +
      "Flag vague eco-claims ('conscious', 'eco-friendly', 'sustainable') that lack certification as greenwash.",
    prompt:
      `Page title: ${signal.title}\nSite: ${signal.siteName}\n\nPage content:\n"""${signal.text.slice(0, 7000)}"""`,
  });
  // Fold multi-part garments ("Shell: 100% Cotton, Lining: 100% Polyester")
  // into one garment's composition before anything downstream reads it, // otherwise the fibre mark reports totals like "200% plastic".
  return { ...object, fabric_composition: consolidateComposition(object.fabric_composition) };
}

/**
 * Read the garment's real colour and pattern FROM THE IMAGE.
 *
 * The whole reason "recommend a look-alike" kept failing: the matcher took
 * colour and pattern from the product TITLE ("Utility Short Blouson Jacket"
 * names neither), so it could only match on garment type and price and the
 * pictures looked nothing alike. The colour is in the photo, not the words —
 * so we look at the photo. Runs in parallel with the text extraction (see the
 * scan route), so it adds no latency to the critical composition read.
 *
 * `colour` is a free phrase ("olive", "pink and white") mapped to the same
 * family vocabulary as the catalogue via colourFamilies(); `pattern` uses the
 * matcher's own enum. Returns null on any failure — matching then falls back
 * to the title, i.e. exactly today's behaviour, never worse.
 */
const visualSchema = z.object({
  colour: z.string().describe("The garment's main colour(s) in plain words, e.g. 'olive green', 'pink and white', 'navy'. The fabric colour, ignore the model, background or props."),
  pattern: z.enum(["check", "stripe", "floral", "spot", "print", "plain"]).describe("The garment's surface pattern. 'check' includes gingham/plaid/tartan; 'print' is any other graphic/all-over print; 'plain' is a solid colour with no pattern."),
});

export interface VisualAttributes {
  colour: string | null;
  pattern: Pattern;
}

export async function visualAttributes(imageUrl: string): Promise<VisualAttributes> {
  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: visualSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe only this GARMENT's colour and surface pattern for a shopping look-alike match. Judge the clothing itself, not the model, background, hanger or styling.",
            },
            { type: "image", image: new URL(imageUrl) },
          ],
        },
      ],
    });
    return { colour: object.colour || null, pattern: object.pattern };
  } catch {
    return { colour: null, pattern: "plain" };
  }
}

export function scoreExtraction(
  object: Pick<ExtractionResult, "found_composition" | "fabric_composition" | "certifications" | "practices">,
): { score: number; grade: string; factors: ScoreFactor[] } | null {
  if (!object.found_composition || object.fabric_composition.length === 0) return null;
  return computeScore({
    fabric_composition: object.fabric_composition,
    certifications: object.certifications,
    practices: object.practices as Practices,
    brand_ethics_modifier: 0, // unknown brand, fibre and certs only
  });
}
