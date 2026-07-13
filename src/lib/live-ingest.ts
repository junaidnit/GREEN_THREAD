import type { FabricPart, MaterialId } from "./types";

/**
 * Parse a real product description for a stated fibre composition.
 * Returns null unless percentages are explicit and sum to ~100 — we only
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
  // multi-part garments (shell 100% + lining 100%) — average down to one garment
  if (total > 110 && total % 100 === 0) {
    const factor = total / 100;
    out = out.map((p) => ({ ...p, pct: Math.round(p.pct / factor) }));
    total = out.reduce((s, p) => s + p.pct, 0);
  }
  if (total < 90 || total > 110) return null; // label doesn't add up — don't guess
  return out.map((p) => ({ ...p, pct: Math.round((p.pct / total) * 100) }));
}

/** Map a Shopify product_type / title to our category taxonomy. */
export function mapCategory(productType: string, title: string): string {
  const t = `${productType} ${title}`.toLowerCase();
  if (/dress|jumpsuit/.test(t)) return "dresses";
  if (/skirt/.test(t)) return "skirts";
  if (/jean|denim/.test(t)) return "jeans";
  if (/trouser|pant|legging|short|culotte/.test(t)) return "trousers";
  if (/hoodie|sweatshirt/.test(t)) return "hoodies";
  if (/jumper|cardigan|knit|sweater/.test(t)) return "knitwear";
  if (/jacket|coat|gilet|outerwear/.test(t)) return "outerwear";
  if (/t-?shirt|\btee\b|\btop\b|vest/.test(t)) return "t-shirts";
  if (/shirt|blouse/.test(t)) return "shirts";
  if (/sock|scarf|hat|beanie|beret|bag|belt|glove|mitten|headband|accessor/.test(t)) return "accessories";
  return "shirts";
}
