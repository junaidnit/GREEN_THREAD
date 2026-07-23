import { NextResponse } from "next/server";
import { extractComposition, scoreExtraction, visualAttributes, type VisualAttributes } from "@/lib/extract";
import { hasAnthropicKey } from "@/lib/env";
import { getBetterFibreMatch } from "@/lib/catalog";
import { mapCategory } from "@/lib/live-ingest";
import { fibreMark, misleadingName } from "@/lib/materials";

export const maxDuration = 60;

/**
 * Browser-extension endpoint: the "similar shirt, better fibre" agent.
 * Unlike /api/analyze, this never fetches a URL itself, the extension's
 * content script has already scraped the live, rendered DOM in the user's
 * own browser (composition text, JSON-LD, title, price), which sidesteps
 * the bot-blocking that stops server-side fetches on some retailer sites.
 * We just extract, score, and find real Fibre Set alternatives.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Where the time goes, reported on the response itself.
 *
 * A cold start here was taking tens of seconds and every diagnosis was
 * guesswork. Server-Timing makes the breakdown readable from any client, so
 * the next time this is slow it takes one request to find out why rather
 * than a deploy-and-guess cycle.
 */
const MODULE_READY = Date.now();

export async function POST(req: Request) {
  const t0 = Date.now();
  const marks: string[] = [`boot;dur=${t0 - MODULE_READY}`];
  const note = (name: string, from: number) => marks.push(`${name};dur=${Date.now() - from}`);
  const timed = (extra: Record<string, string> = {}) => ({
    ...CORS_HEADERS,
    ...extra,
    "Server-Timing": marks.join(", "),
  });

  if (!hasAnthropicKey()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503, headers: timed() });
  }

  const body = await req.json().catch(() => null);
  const { url, title, siteName, text, imageUrl } = body ?? {};
  if (typeof url !== "string" || typeof text !== "string" || text.trim().length < 20) {
    return NextResponse.json(
      { error: "Not enough page content to check." },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  const validImage = typeof imageUrl === "string" && /^https?:\/\//.test(imageUrl) ? imageUrl : null;

  // hostname is best-effort context for the model, never let a malformed
  // url string throw here
  let host = "";
  try { host = new URL(url).hostname; } catch { /* leave blank */ }

  let object: Awaited<ReturnType<typeof extractComposition>>;
  // The image read runs alongside the composition read, not after it, so
  // looking at the photo costs no extra wall-clock time. A failed/absent image
  // just yields null attributes and matching falls back to the title.
  let visual: VisualAttributes = { colour: null, families: [], pattern: "plain" };
  const tModel = Date.now();
  try {
    [object, visual] = await Promise.all([
      extractComposition({
        title: typeof title === "string" && title ? title : "Untitled product",
        siteName: typeof siteName === "string" && siteName ? siteName : host,
        text,
      }),
      validImage ? visualAttributes(validImage) : Promise.resolve(visual),
    ]);
  } catch (e) {
    console.error("[ext-scan] extraction failed:", e);
    return NextResponse.json(
      { error: "Couldn't analyse this item just now, try again." },
      { status: 502, headers: timed() },
    );
  }
  note("model", tModel);
  const scored = scoreExtraction(object);

  if (!scored) {
    return NextResponse.json(
      {
        found: false,
        title: object.product_name || title || "This item",
        explanation: object.explanation,
      },
      { headers: timed() },
    );
  }

  const mark = fibreMark(object.fabric_composition);
  const misnamed = misleadingName(object.product_name || "", object.fabric_composition);
  const category = mapCategory("", object.product_name || "");
  const priceNum = Number((object.price_text.match(/[\d.,]+/)?.[0] ?? "").replace(/,/g, ""));
  const price = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null;

  const tMatch = Date.now();
  const { items: recommendations, withinPrice, matches } = await getBetterFibreMatch({
    title: object.product_name || title || "",
    category,
    price,
    fabricComposition: object.fabric_composition,
    // what the garment ACTUALLY looks like, read from its photo
    imageColourFamilies: visual.families,
    imagePattern: visual.pattern,
  });

  note("catalog+match", tMatch);
  note("total", t0);

  console.log(
    `[ext-scan] ${new URL(url).hostname} score=${scored.score} recs=${recommendations.length} withinPrice=${withinPrice}`,
  );

  return NextResponse.json(
    {
      found: true,
      title: object.product_name || title || "This item",
      score: scored.score,
      grade: scored.grade,
      fibreMark: mark,
      misnamed,
      composition: object.fabric_composition,
      certifications: object.certifications,
      greenwashFlags: object.greenwash_flags,
      explanation: object.explanation,
      /** false = no natural-fibre option at this price; these cost more */
      recommendationsWithinPrice: withinPrice,
      /** what the photo shows, so the panel can say WHY these were picked */
      looksLike: { colour: visual.colour, pattern: visual.pattern },
      recommendations: recommendations.map((c, i) => ({
        id: c.id,
        title: c.title,
        brand: c.brand.name,
        price: c.price,
        currency: c.currency,
        image_url: c.image_url,
        retailer: c.retailer,
        source: c.source,
        score: c.sustainability.score,
        grade: c.sustainability.grade,
        // how close this really is — never implied, always stated
        sameColour: matches[i]?.sameColour ?? false,
        samePattern: matches[i]?.samePattern ?? false,
        tier: matches[i]?.tier ?? "same-style",
      })),
    },
    { headers: timed() },
  );
}
