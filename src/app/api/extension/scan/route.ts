import { NextResponse } from "next/server";
import { extractComposition, scoreExtraction } from "@/lib/extract";
import { hasAnthropicKey } from "@/lib/env";
import { getBetterFibreMatch } from "@/lib/catalog";
import { mapCategory } from "@/lib/live-ingest";
import { fibreMark, misleadingName } from "@/lib/materials";

export const maxDuration = 60;

/**
 * Browser-extension endpoint: the "similar shirt, better fibre" agent.
 * Unlike /api/analyze, this never fetches a URL itself — the extension's
 * content script has already scraped the live, rendered DOM in the user's
 * own browser (composition text, JSON-LD, title, price), which sidesteps
 * the bot-blocking that stops server-side fetches on some retailer sites.
 * We just extract, score, and find real GreenThread alternatives.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  if (!hasAnthropicKey()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => null);
  const { url, title, siteName, text } = body ?? {};
  if (typeof url !== "string" || typeof text !== "string" || text.trim().length < 20) {
    return NextResponse.json(
      { error: "Not enough page content to check." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const object = await extractComposition({
    title: typeof title === "string" && title ? title : "Untitled product",
    siteName: typeof siteName === "string" && siteName ? siteName : new URL(url).hostname,
    text,
  });
  const scored = scoreExtraction(object);

  if (!scored) {
    return NextResponse.json(
      {
        found: false,
        title: object.product_name || title || "This item",
        explanation: object.explanation,
      },
      { headers: CORS_HEADERS },
    );
  }

  const mark = fibreMark(object.fabric_composition);
  const misnamed = misleadingName(object.product_name || "", object.fabric_composition);
  const category = mapCategory("", object.product_name || "");
  const priceNum = Number((object.price_text.match(/[\d.,]+/)?.[0] ?? "").replace(/,/g, ""));
  const price = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null;

  const recommendations = await getBetterFibreMatch({
    category,
    price,
    fabricComposition: object.fabric_composition,
  });

  console.log(`[ext-scan] ${new URL(url).hostname} score=${scored.score} recs=${recommendations.length}`);

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
      recommendations: recommendations.map((c) => ({
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
      })),
    },
    { headers: CORS_HEADERS },
  );
}
