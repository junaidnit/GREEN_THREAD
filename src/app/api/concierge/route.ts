import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getCatalog } from "@/lib/catalog";
import { applyFilters, buildIndex, EMPTY_FILTERS } from "@/lib/search";
import type { MaterialId, Product } from "@/lib/types";

export const maxDuration = 60;

const materialEnum = z.enum([
  "organic_cotton", "recycled_cotton", "conventional_cotton", "bci_cotton",
  "linen", "hemp", "tencel_lyocell", "modal", "cupro", "viscose",
  "merino_wool", "lambswool", "recycled_wool", "virgin_wool", "peace_silk",
  "recycled_polyester", "polyester", "recycled_polyamide", "polyamide",
  "elastane", "other",
]);

/** Compact product shape sent to the model and rendered as cards in chat. */
function compact(p: Product) {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand.name,
    price: p.price,
    currency: p.currency,
    retailer: p.retailer,
    category: p.category,
    gender: p.gender,
    score: p.sustainability.score,
    grade: p.sustainability.grade,
    fabric: p.fabric_composition.map((f) => `${f.pct}% ${f.label}`).join(", "),
    certifications: p.sustainability.certifications,
    greenwash_flags: p.sustainability.greenwash_flags,
    image_url: p.image_url,
    url: `/product/${p.id}`,
  };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Concierge is not configured (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const products = await getCatalog();
  const index = buildIndex(products);

  const result = streamText({
    model: anthropic("claude-sonnet-5"),
    system:
      "You are the GreenThread concierge — a sharp, honest sustainable-fashion shopping assistant for our catalog. " +
      "Use the search_catalog tool to find real products before recommending anything; never invent products. " +
      "The UI renders product cards for whatever your tool calls return, so keep your text short: explain WHY the picks fit " +
      "(fabric properties, certifications, score) in 2-4 sentences, plain language. " +
      "Be honest about trade-offs (e.g. recycled polyester sheds microfibres; conventional cotton is thirsty). " +
      "If a product has greenwash_flags, mention that some of its claims are unverified. " +
      "If nothing fits, say so and suggest the closest alternative. Prices are in GBP (£); the shopper is in the UK. " +
      "Write plain conversational text only — no markdown, no asterisks, no bullet lists.",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(4),
    tools: {
      search_catalog: tool({
        description:
          "Search the GreenThread catalog. Returns matching products with fabric composition and sustainability data. " +
          "Use free-text query for style/garment words, and structured filters for fabric, price and score constraints.",
        inputSchema: z.object({
          query: z.string().describe("Free-text search, e.g. 'linen shirt summer'. Can be empty when only filtering."),
          fabrics: z.array(materialEnum).optional().describe("Only products containing ANY of these fibres"),
          exclude_fabrics: z.array(materialEnum).optional().describe("Exclude products containing ANY of these fibres"),
          category: z.string().optional(),
          gender: z.enum(["men", "women", "unisex"]).optional(),
          max_price: z.number().optional().describe("Max price in GBP"),
          min_score: z.number().optional().describe("Minimum sustainability score 0-100"),
          limit: z.number().min(1).max(8).default(5),
        }),
        execute: async ({ query, fabrics, exclude_fabrics, category, gender, max_price, min_score, limit }) => {
          let results = applyFilters(
            products,
            {
              ...EMPTY_FILTERS,
              q: query ?? "",
              fabrics: (fabrics ?? []) as MaterialId[],
              categories: category ? [category] : [],
              gender: gender ?? null,
              maxPrice: max_price ?? null,
              minScore: min_score ?? null,
              sort: query ? "relevance" : "score",
            },
            index,
          );
          if (exclude_fabrics?.length) {
            results = results.filter(
              (p) => !p.fabric_composition.some((f) => exclude_fabrics.includes(f.material) && f.pct >= 5),
            );
          }
          return { count: results.length, products: results.slice(0, limit ?? 5).map(compact) };
        },
      }),
      get_product_details: tool({
        description: "Full detail for one product by id, including score factors, explanation and brand ethics.",
        inputSchema: z.object({ id: z.string() }),
        execute: async ({ id }) => {
          const p = products.find((x) => x.id === id);
          if (!p) return { error: "not found" };
          return {
            ...compact(p),
            description: p.description,
            explanation: p.sustainability.explanation,
            factors: p.sustainability.factors,
            brand_ethics: p.brand.ethics_summary,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
