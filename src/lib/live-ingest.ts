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

export function parseComposition(text: string): FabricPart[] | null {
  const parts: FabricPart[] = [];
  // "95% Organic Cotton", "5 % elastane", "70% TENCEL™ Lyocell"
  const re = /(\d{1,3})\s*%\s*([A-Za-z®™&\- ]{3,40}?)(?=[,.;()<]|\s{2,}|\s\d|$)/g;
  for (const m of text.matchAll(re)) {
    const pct = Number(m[1]);
    const label = m[2].trim().replace(/\s+/g, " ");
    if (pct <= 0 || pct > 100) continue;
    const hit = FIBRE_MAP.find((f) => f.re.test(label));
    if (!hit) continue;
    parts.push({ material: hit.material(label), label, pct });
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
