import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { computeScore } from "@/lib/scoring";
import type { Practices } from "@/lib/types";

export const maxDuration = 60;

/**
 * Link-paste analyzer — the BuyHatke move, pointed at fabric.
 * Fetches any product URL, harvests structured metadata (JSON-LD Product,
 * OpenGraph, meta tags) plus visible text, then runs the same Claude
 * extraction agent used by the catalog pipeline and scores it with the
 * same transparent rubric.
 */

const materialEnum = z.enum([
  "organic_cotton", "recycled_cotton", "conventional_cotton", "bci_cotton",
  "linen", "hemp", "tencel_lyocell", "modal", "cupro", "viscose",
  "merino_wool", "lambswool", "recycled_wool", "virgin_wool", "peace_silk",
  "recycled_polyester", "polyester", "recycled_polyamide", "polyamide",
  "elastane", "other",
]);

const CANONICAL_CERTS = [
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

interface PageMeta {
  title: string;
  image: string | null;
  siteName: string | null;
  text: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
}

function extractMeta(html: string): PageMeta {
  const meta = (name: string): string | null => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,
      "i",
    );
    const m = html.match(re);
    return m ? decodeEntities(m[1] ?? m[2] ?? "") : null;
  };

  // JSON-LD Product blocks are the highest-quality source when present
  let jsonLd = "";
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1]);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
        const t = node?.["@type"];
        if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) {
          jsonLd += ` PRODUCT-DATA: ${JSON.stringify(node).slice(0, 3000)}`;
        }
      }
    } catch { /* malformed JSON-LD is common; skip */ }
  }

  const bodyText = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );

  // bias the text window toward where composition usually lives
  const compIdx = bodyText.search(/composition|material|fabric|% (cotton|polyester|linen|wool|viscose|elastane)/i);
  const window =
    compIdx > 2000
      ? bodyText.slice(0, 1500) + " … " + bodyText.slice(compIdx - 500, compIdx + 4000)
      : bodyText.slice(0, 6000);

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();

  return {
    title: meta("og:title") ?? (titleTag ? decodeEntities(titleTag) : "Untitled product"),
    image: meta("og:image"),
    siteName: meta("og:site_name"),
    text: `${meta("og:description") ?? ""} ${jsonLd} ${window}`.trim(),
  };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Analyzer is not configured." }, { status: 503 });
  }
  const { url } = await req.json();
  let target: URL;
  try {
    target = new URL(url);
    if (!/^https?:$/.test(target.protocol)) throw new Error();
  } catch {
    return Response.json({ error: "That doesn't look like a valid product link." }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(target.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!res.ok) {
      return Response.json(
        { error: `The retailer's site wouldn't share the page (HTTP ${res.status}). Some sites block automated reading — try another link.` },
        { status: 422 },
      );
    }
    html = (await res.text()).slice(0, 800_000);
  } catch {
    return Response.json(
      { error: "Couldn't reach that page — it may be blocking automated reading or timed out." },
      { status: 422 },
    );
  }

  const meta = extractMeta(html);

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: extractionSchema,
    system:
      "You are a textile sustainability analyst. Extract structured data from scraped product-page content precisely. " +
      "Never invent fibres, percentages or certifications not present in the text. If no composition is stated, say so " +
      "(found_composition=false) — an honest 'not disclosed' matters more than a guess. " +
      "Flag vague eco-claims ('conscious', 'eco-friendly', 'sustainable') that lack certification as greenwash.",
    prompt:
      `Page title: ${meta.title}\nSite: ${meta.siteName ?? target.hostname}\n\nPage content:\n"""${meta.text.slice(0, 7000)}"""`,
  });

  let scored = null;
  if (object.found_composition && object.fabric_composition.length > 0) {
    scored = computeScore({
      fabric_composition: object.fabric_composition,
      certifications: object.certifications,
      practices: object.practices as Practices,
      brand_ethics_modifier: 0, // unknown brand — fibre and certs only
    });
  }

  console.log(`[analyze] ${target.hostname} composition=${object.found_composition} score=${scored?.score ?? "n/a"}`);

  return Response.json({
    url: target.href,
    site: meta.siteName ?? target.hostname,
    title: object.product_name || meta.title,
    image: meta.image,
    // scrub common charset mojibake (Â£ → £) from scraped price text
    price_text: object.price_text.replace(/Â(?=[£€$])/g, ""),
    found_composition: object.found_composition,
    fabric_composition: object.fabric_composition,
    certifications: object.certifications,
    practices: object.practices,
    greenwash_flags: object.greenwash_flags,
    explanation: object.explanation,
    score: scored?.score ?? null,
    grade: scored?.grade ?? null,
    factors: scored?.factors ?? [],
  });
}
