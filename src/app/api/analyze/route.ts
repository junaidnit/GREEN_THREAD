import { extractComposition, scoreExtraction } from "@/lib/extract";
import { hasAnthropicKey } from "@/lib/env";

export const maxDuration = 60;

/**
 * Link-paste analyzer — the BuyHatke move, pointed at fabric.
 * Fetches any product URL, harvests structured metadata (JSON-LD Product,
 * OpenGraph, meta tags) plus visible text, then runs the same Claude
 * extraction agent used by the catalog pipeline and scores it with the
 * same transparent rubric.
 */

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
  if (!hasAnthropicKey()) {
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

  const object = await extractComposition({
    title: meta.title,
    siteName: meta.siteName ?? target.hostname,
    text: meta.text,
  });

  const scored = scoreExtraction(object);

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
