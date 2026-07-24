import type { FabricPart, MaterialId } from "./types";

/**
 * Parse a real product description for a stated fibre composition.
 * Returns null unless percentages are explicit and sum to ~100, we only
 * ingest products whose labels actually disclose what they're made of.
 */

const FIBRE_MAP: Array<{ re: RegExp; material: (ctx: string) => MaterialId }> = [
  { re: /organic\s+cotton/i, material: () => "organic_cotton" },
  { re: /recycled\s+cotton/i, material: () => "recycled_cotton" },
  { re: /\bcotton\b/i, material: (ctx) => (/\borganic\b/i.test(ctx) ? "organic_cotton" : "conventional_cotton") },
  { re: /tencel|lyocell/i, material: () => "tencel_lyocell" },
  { re: /modal/i, material: () => "modal" },
  { re: /\bhemp\b/i, material: () => "hemp" },
  { re: /\blinen\b|\bflax\b/i, material: () => "linen" },
  { re: /recycled\s+(polyester|pet)/i, material: () => "recycled_polyester" },
  { re: /polyester/i, material: () => "polyester" },
  { re: /recycled\s+(nylon|polyamide)|econyl/i, material: () => "recycled_polyamide" },
  { re: /nylon|polyamide/i, material: () => "polyamide" },
  { re: /elastane|spandex|lycra/i, material: () => "elastane" },
  { re: /merino/i, material: () => "merino_wool" },
  { re: /lambswool/i, material: () => "lambswool" },
  { re: /recycled\s+wool/i, material: () => "recycled_wool" },
  { re: /\bwool\b/i, material: () => "virgin_wool" },
  { re: /\bsilk\b/i, material: () => "peace_silk" },
  { re: /cupro/i, material: () => "cupro" },
  { re: /bamboo|viscose|rayon|ecovero/i, material: () => "viscose" },
];

/**
 * Turn a Shopify body_html into readable, multi-line plain text — decoded and
 * with the merchant's own structure (paragraphs, bullet lists, the
 * THINGS TO KNOW / SIZE & FIT / SUSTAINABILITY headings) preserved as line
 * breaks. The old ingest flattened everything to one run and truncated at 600
 * chars, which is why product pages showed a cut-off blob. Rendered with
 * `whitespace-pre-line`, this reads like the merchant's own description.
 */
export function formatDescription(html: string, cap = 4000): string {
  if (!html) return "";
  let s = html
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/ul|\/ol)\s*[^>]*>/gi, "\n")
    .replace(/<\s*(p|div|h[1-6]|tr|ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;|&#160;|&#xa0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&hellip;/gi, "…")
    // mojibake artifacts from mis-decoded non-breaking spaces
    .replace(/Â | |Â/g, " ");
  s = demojibake(s);
  s = s
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s.length > cap ? s.slice(0, cap).replace(/\s+\S*$/, "") + "…" : s;
}

/**
 * Repair mojibake some feeds ship — UTF-8 punctuation / non-breaking spaces
 * decoded as Latin-1 at the merchant's end, arriving as "¬†" (U+00AC U+2020),
 * "Â ", "â€™", etc. Idempotent: a no-op on clean text.
 */
export function demojibake(s: string): string {
  return s
    .replace(/¬†/g, " ") // "¬†" -> nbsp
    .replace(/Â /g, " ") // "Â " -> nbsp
    .replace(/â€™/g, "'") // "â€™" -> '
    .replace(/â€“/g, "–") // "â€“" -> en dash
    .replace(/â€”/g, "—") // em dash
    .replace(/â€œ/g, '"') // "â€œ" -> open quote
    .replace(/â€/g, '"') // close quote
    .replace(/ /g, " "); // real nbsp -> space
}

export function parseComposition(text: string): FabricPart[] | null {
  const parts: FabricPart[] = [];

  /**
   * Anchor on the PERCENTAGE, then look for a known fibre in the words that
   * follow — rather than trying to capture the fibre name as a tidy phrase.
   *
   * The old regex demanded a clean delimiter after the name ([,.;()<], a
   * double space, or end of string) and capped it at 40 characters. Real
   * product copy does neither: "100% Cotton V neck Topstitching detail" runs
   * the composition straight into the feature list, and Celtic & Co separate
   * with "•". Both were silently REJECTED, which is why a wool-and-linen
   * brand looked like it disclosed almost nothing (12 of 150) and why good
   * items were dropped from brands already in the catalogue.
   *
   * Matching against the fibre vocabulary instead is both looser about
   * punctuation and stricter about meaning: "50% off" finds no fibre in its
   * window and is ignored, exactly as before.
   */
  const pctRe = /(\d{1,3})\s*%/g;
  const hits = [...text.matchAll(pctRe)];
  for (let i = 0; i < hits.length; i++) {
    const pct = Number(hits[i][1]);
    if (pct <= 0 || pct > 100) continue;
    const from = (hits[i].index ?? 0) + hits[i][0].length;
    // stop at the next percentage so "70% Cotton, 30% Linen" can't read
    // "Linen" as the fibre for the 70% part
    const nextAt = i + 1 < hits.length ? (hits[i + 1].index ?? text.length) : text.length;
    const window = text.slice(from, Math.min(nextAt, from + 60));

    // the EARLIEST fibre mentioned wins, which also settles specificity for
    // free: in "Organic Cotton", /organic\s+cotton/ starts before /cotton/
    let best: { at: number; label: string; material: MaterialId } | null = null;
    for (const f of FIBRE_MAP) {
      const m = window.match(f.re);
      if (m?.index == null) continue;
      if (best === null || m.index < best.at) {
        best = { at: m.index, label: m[0].trim(), material: f.material(window) };
      }
    }
    if (!best) continue;
    parts.push({ material: best.material, label: best.label, pct });
  }
  if (parts.length === 0) return null;
  // merge duplicate materials (multi-part garments)
  const merged = new Map<string, FabricPart>();
  for (const p of parts) {
    const prev = merged.get(p.material);
    if (prev) prev.pct += p.pct;
    else merged.set(p.material, { ...p });
  }
  let out = [...merged.values()];
  let total = out.reduce((s, p) => s + p.pct, 0);
  // multi-part garments (shell 100% + lining 100%), average down to one garment
  if (total > 110 && total % 100 === 0) {
    const factor = total / 100;
    out = out.map((p) => ({ ...p, pct: Math.round(p.pct / factor) }));
    total = out.reduce((s, p) => s + p.pct, 0);
  }
  if (total < 90 || total > 110) return null; // label doesn't add up, don't guess
  return out.map((p) => ({ ...p, pct: Math.round((p.pct / total) * 100) }));
}

/**
 * Map a Shopify product_type / title to our category taxonomy.
 *
 * Order matters, and two traps are worth spelling out:
 *  · "short" is an adjective far more often than a garment, "Short Sleeve
 *    Henley Top", "Utility Short Blouson Jacket". Matching bare /short/ filed
 *    tops and jackets as trousers, so only the plural \bshorts\b counts.
 *  · The garment type beats the fabric: a "Denim Jacket" is outerwear, not
 *    jeans, so outerwear is tested before the denim rule.
 */
export function mapCategory(productType: string, title: string): string {
  const t = `${productType} ${title}`.toLowerCase();
  if (/sock|scarf|\bhat\b|beanie|beret|\bbag\b|belt|glove|mitten|headband|accessor/.test(t)) return "accessories";
  if (/jacket|coat|gilet|blazer|parka|blouson|anorak|outerwear/.test(t)) return "outerwear";
  if (/dress|jumpsuit|playsuit/.test(t)) return "dresses";
  if (/skirt/.test(t)) return "skirts";
  if (/hoodie|sweatshirt/.test(t)) return "hoodies";
  if (/jumper|cardigan|knit|sweater/.test(t)) return "knitwear";
  if (/jean|denim/.test(t)) return "jeans";
  if (/trouser|\bpant|legging|\bshorts\b|culotte|chino/.test(t)) return "trousers";
  if (/t-?shirt|\btee\b|\btop\b|vest|henley|camisole/.test(t)) return "t-shirts";
  if (/shirt|blouse/.test(t)) return "shirts";
  // Defaulting to "shirts" was silently wrong: a purse, a necklace, a cutlery
  // holder and a macrame plant-hanger kit all arrived filed as shirts, which
  // put them in the shirts facet AND let them pass the matcher's garment gate
  // as recommended alternatives to a t-shirt. Unclassifiable is its own
  // answer, say so rather than guessing a garment.
  return "other";
}

/**
 * Tidy a raw feed size label into a consistent one. Brands spell the same
 * size a dozen ways ("Small", "S", "SIZE 1 / UK 8 / EUR 36"); left raw, the
 * size facet fragments into 38 near-duplicates. Letter sizes normalise to
 * XS/S/M/L/XL/XXL; UK numeric sizes collapse to "UK 8"; anything else is
 * returned trimmed rather than dropped.
 */
export function normalizeSize(raw: string): string {
  const s = raw.trim();
  const uk = s.match(/\bUK\s?(\d{1,2})\b/i) ?? s.match(/^(\d{1,2})$/);
  if (uk) return `UK ${uk[1]}`;
  const letter = s.toLowerCase().replace(/[\s.-]/g, "");
  const map: Record<string, string> = {
    xxs: "XXS", extraextrasmall: "XXS",
    xs: "XS", extrasmall: "XS", xsmall: "XS",
    s: "S", small: "S",
    m: "M", medium: "M", med: "M",
    l: "L", large: "L",
    xl: "XL", extralarge: "XL", xlarge: "XL",
    xxl: "XXL", extraextralarge: "XXL", "2xl": "XXL",
    xxxl: "XXXL", "3xl": "XXXL",
    onesize: "One size", os: "One size",
  };
  return map[letter] ?? s;
}
