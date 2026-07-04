/** Deterministic product attribute derivation shared by pipeline scripts. */

const COLOR_FAMILY: Array<[RegExp, string]> = [
  [/multi|3-pack|white\/grey\/black|mixed/i, "Multi"],
  [/stripe/i, "Blue"],
  [/black|charcoal|graphite|ink|midnight/i, "Black"],
  [/white|ecru|cream|natural|pearl|ivory|cloud|stone|oat|champagne|undyed/i, "White & Cream"],
  [/grey|heather|basalt|melange/i, "Grey"],
  [/navy|sky|blue|indigo|storm|teal|denim/i, "Blue"],
  [/moss|sage|olive|forest|pine|green|emerald/i, "Green"],
  [/clay|terracotta|rust|tobacco|walnut|camel|brown|sand|khaki|butter|duck/i, "Brown & Tan"],
  [/blush|pink|lilac|rose|dusty/i, "Pink & Purple"],
  [/coral|red|ember/i, "Red & Orange"],
  [/yellow/i, "Yellow"],
];

export function colorFamily(color: string): string {
  for (const [re, fam] of COLOR_FAMILY) if (re.test(color)) return fam;
  return "Multi";
}

const SIZE_POOLS: Record<string, string[]> = {
  accessories: ["One size"],
  jeans: ["W26", "W28", "W30", "W32", "W34", "W36"],
  default: ["XS", "S", "M", "L", "XL"],
};

/** Derive fit from title keywords; default Regular. */
export function fitFor(title: string): string {
  if (/boxy|oversized/i.test(title)) return "Oversized";
  if (/relaxed|drawstring|lounge|comfy/i.test(title)) return "Relaxed";
  if (/slim|sculpt|slip/i.test(title)) return "Slim";
  if (/wide|palazzo/i.test(title)) return "Wide";
  return "Regular";
}

/** Deterministic per-product size availability: drop 0–2 sizes by slug hash. */
export function sizesFor(slug: string, category: string): string[] {
  const pool = SIZE_POOLS[category] ?? SIZE_POOLS.default;
  if (pool.length === 1) return pool;
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const drop = h % 3; // 0, 1 or 2 sizes unavailable
  const out = [...pool];
  for (let i = 0; i < drop; i++) out.splice((h >> (3 * (i + 1))) % out.length, 1);
  return out;
}
