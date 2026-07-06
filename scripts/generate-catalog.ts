/**
 * Catalog expansion generator — grows the demo catalog to marketplace depth
 * (~1,700 products, 100–200 per brand) with ZERO AI cost.
 *
 * Unlike the 67 hand-written originals (which exercise the Claude extraction
 * pipeline), generated products are constructed as structured data directly:
 * brand-appropriate fabric blends, realistic UK pricing per brand tier, fits,
 * colours, sizes — then scored with the exact same rubric. Deterministic
 * (seeded PRNG), so re-runs produce identical output.
 *
 * Writes data/products_generated.json; also patches `fit` onto the originals.
 * Run:  npx tsx scripts/generate-catalog.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeScore, MATERIAL_LABELS, MATERIAL_NOTES } from "../src/lib/scoring";
import type { FabricPart, MaterialId, Practices, SeedProduct } from "../src/lib/types";
import { colorFamily, fitFor, sizesFor } from "./product-attrs";

/* ── deterministic PRNG ── */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
const pick = <T,>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

/**
 * Verified Unsplash pools per category, each image tagged with its actual
 * dominant garment colour. Products derive their colour FROM the photo, so
 * a card can never say "Forest" while showing a black tee.
 */
type Img = [id: string, colour: string];
/* Every entry visually audited against the actual photo (contact-sheet QA):
   colours corrected, off-category/branded/people-we-shouldn't-use photos removed. */
const IMG: Record<string, Img[]> = {
  "t-shirts": [
    ["photo-1521572163474-6864f9cf17ab", "White"], ["photo-1576566588028-4147f3842f27", "Ecru"],
    ["photo-1583743814966-8936f5b7be1a", "Black"], ["photo-1620799140408-edc6dcb6d633", "Ecru"],
    ["photo-1503341504253-dff4815485f1", "Black"],
    ["photo-1523381210434-271e8be1f52b", "Teal"], ["photo-1554568218-0f1715e72254", "White"],
    ["photo-1571455786673-9d9d6c194f90", "Navy"], ["photo-1622445275576-721325763afe", "White"],
    ["photo-1586363104862-3a5e2ab60d99", "Coral"], ["photo-1581655353564-df123a1eb820", "White"],
    ["photo-1596609548086-85bbf8ddb6b9", "Navy"], ["photo-1603252109303-2751441dd157", "White"],
  ],
  shirts: [
    ["photo-1596755094514-f87e34085b2c", "Indigo"], ["photo-1602810318383-e386cc2a3ccf", "Multi"],
    ["photo-1620012253295-c15cc3e65df4", "Sky Blue"], ["photo-1611312449408-fcece27cdbb7", "Indigo"],
    ["photo-1589310243389-96a5483213a8", "Sky Blue"],
    ["photo-1562157873-818bc0726f68", "Multi"], ["photo-1603251579431-8041402bdeda", "Multi"],
    ["photo-1598961942613-ba897716405b", "White"], ["photo-1626497764746-6dc36546b388", "Multi"],
    ["photo-1564257631407-4deb1f99d992", "Ivory"], ["photo-1591369822096-ffd140ec948f", "Sky Blue"],
  ],
  jeans: [
    ["photo-1542272604-787c3835535d", "Indigo"], ["photo-1541099649105-f69ad21f3246", "Sky Blue"],
    ["photo-1604176354204-9268737828e4", "Indigo"], ["photo-1475178626620-a4d074967452", "Sky Blue"],
    ["photo-1582418702059-97ebafb35d09", "Indigo"], ["photo-1565084888279-aca607ecce0c", "Navy"],
    ["photo-1598554747436-c9293d6a588f", "Sky Blue"], ["photo-1584865288642-42078afe6942", "Black"],
    ["photo-1555689502-c4b22d76c56f", "Navy"],
  ],
  trousers: [
    ["photo-1594633312681-425c7b97ccd1", "Blush"], ["photo-1624378439575-d8705ad7ae80", "Charcoal"],
    ["photo-1584370848010-d7fe6bc767ec", "Sky Blue"],
    ["photo-1473966968600-fa801b869a1a", "Camel"], ["photo-1591195853828-11db59a44f6b", "Sky Blue"],
  ],
  dresses: [
    ["photo-1515372039744-b8f02a3ae446", "White"], ["photo-1595777457583-95e059d581b8", "Coral"],
    ["photo-1572804013309-59a88b7e92f1", "Poppy Red"], ["photo-1496747611176-843222e1e57c", "Multi"],
    ["photo-1566174053879-31528523f8ae", "Berry"], ["photo-1445205170230-053b83016050", "Multi"],
    ["photo-1520903920243-00d872a2d1c9", "Black"],
  ],
  skirts: [
    ["photo-1583496661160-fb5886a0aaaa", "Black"], ["photo-1594633312681-425c7b97ccd1", "Blush"],
  ],
  knitwear: [
    ["photo-1434389677669-e08b4cac3105", "Ecru"], ["photo-1544022613-e87ca75a784a", "Olive"],
    ["photo-1610288311735-39b7facbd095", "Camel"],
    ["photo-1631541909061-71e349d1f203", "Ecru"],
  ],
  hoodies: [
    ["photo-1556821840-3a63f95609a7", "Grey Marl"], ["photo-1618517351616-38fb9c5210c6", "Black"],
    ["photo-1565693413579-8ff3fdc1b03b", "Blush"], ["photo-1620799139507-2a76f79a2f4d", "Ecru"],
  ],
  activewear: [
    ["photo-1506629082955-511b1aa562c8", "Navy"], ["photo-1571945153237-4929e783af4a", "White"],
    ["photo-1518310383802-640c2de311b2", "Multi"], ["photo-1483721310020-03333e577078", "Charcoal"],
    ["photo-1552902865-b72c031ac5ea", "Basalt"],
    ["photo-1517836357463-d25dfeac3438", "Black"], ["photo-1571019613454-1cb2f99b2d8b", "Coral"],
    ["photo-1584466977773-e625c37cdd50", "Black"],
  ],
  outerwear: [
    ["photo-1551028719-00167b16eac5", "Black"], ["photo-1539533018447-63fcce2678e3", "Camel"],
    ["photo-1591047139829-d91aecb6caea", "Rust"], ["photo-1548126032-079a0fb0099d", "Black"],
    ["photo-1521223890158-f9f7c3d5d504", "Black"], ["photo-1544923246-77307dd654cb", "Indigo"],
    ["photo-1495105787522-5334e3ffa0ef", "Sky Blue"],
    ["photo-1489987707025-afc232f7ea0f", "Multi"],
  ],
  accessories: [
    ["photo-1544816155-12df9643f363", "Ecru"], ["photo-1510598969022-c4c6c5d05769", "Forest"],
    ["photo-1556905055-8f358a7a47b2", "Rust"], ["photo-1586350977771-b3b0abd50c82", "Multi"],
    ["photo-1620799139507-2a76f79a2f4d", "Ecru"], ["photo-1547949003-9792a18a2601", "Black"],
  ],
};

/* ── fabric blend pools ── */
type Blend = Array<[MaterialId, number]>;
const BLENDS: Record<string, Blend[]> = {
  heroEco: [
    [["organic_cotton", 100]], [["hemp", 55], ["organic_cotton", 45]], [["linen", 100]],
    [["tencel_lyocell", 100]], [["recycled_cotton", 60], ["organic_cotton", 40]],
    [["organic_cotton", 95], ["elastane", 5]], [["hemp", 100]], [["linen", 55], ["organic_cotton", 45]],
  ],
  midEco: [
    [["organic_cotton", 100]], [["tencel_lyocell", 100]], [["organic_cotton", 60], ["recycled_polyester", 40]],
    [["modal", 92], ["elastane", 8]], [["recycled_polyester", 100]], [["cupro", 100]],
    [["organic_cotton", 98], ["elastane", 2]], [["tencel_lyocell", 70], ["organic_cotton", 30]],
  ],
  budget: [
    [["conventional_cotton", 100]], [["bci_cotton", 60], ["polyester", 40]], [["bci_cotton", 100]],
    [["conventional_cotton", 65], ["polyester", 35]], [["polyester", 100]], [["viscose", 100]],
    [["bci_cotton", 70], ["polyester", 25], ["elastane", 5]],
  ],
  active: [
    [["recycled_polyester", 88], ["elastane", 12]], [["recycled_polyamide", 78], ["elastane", 22]],
    [["recycled_polyester", 100]], [["polyester", 85], ["elastane", 15]],
    [["merino_wool", 60], ["tencel_lyocell", 40]],
  ],
  denimEco: [
    [["organic_cotton", 99], ["elastane", 1]], [["recycled_cotton", 65], ["organic_cotton", 33], ["elastane", 2]],
    [["organic_cotton", 100]], [["hemp", 60], ["organic_cotton", 38], ["elastane", 2]],
  ],
  denimBudget: [
    [["conventional_cotton", 98], ["elastane", 2]], [["bci_cotton", 92], ["polyester", 6], ["elastane", 2]],
    [["bci_cotton", 100]], [["conventional_cotton", 80], ["polyester", 18], ["elastane", 2]],
  ],
  knit: [
    [["merino_wool", 100]], [["recycled_wool", 80], ["polyamide", 20]], [["lambswool", 100]],
    [["organic_cotton", 100]], [["tencel_lyocell", 70], ["organic_cotton", 30]],
    [["merino_wool", 70], ["tencel_lyocell", 30]],
  ],
  knitBudget: [
    [["polyester", 60], ["viscose", 35], ["elastane", 5]], [["conventional_cotton", 100]],
    [["viscose", 55], ["polyamide", 45]], [["bci_cotton", 70], ["polyester", 30]],
  ],
  occasion: [
    [["tencel_lyocell", 100]], [["cupro", 100]], [["peace_silk", 100]], [["viscose", 100]],
    [["linen", 100]], [["organic_cotton", 100]], [["modal", 95], ["elastane", 5]],
  ],
  outer: [
    [["recycled_polyester", 100]], [["recycled_polyamide", 100]], [["organic_cotton", 100]],
    [["hemp", 100]], [["recycled_wool", 70], ["polyamide", 30]], [["polyester", 100]],
  ],
};

/* ── categories ── */
interface CategoryDef {
  styles: string[];
  fits: string[];
  base: number; // GBP base price
  genders: Array<"men" | "women" | "unisex">;
  pool: (tier: string) => Blend[];
}
const CATS: Record<string, CategoryDef> = {
  "t-shirts": {
    styles: ["Crew Tee", "V-Neck Tee", "Pocket Tee", "Longline Tee", "Cropped Tee", "Heavyweight Tee", "Slub Tee", "Henley", "Ringer Tee", "Everyday Tee", "Rib Tank", "Striped Tee"],
    fits: ["Regular", "Relaxed", "Oversized", "Slim"],
    base: 18,
    genders: ["men", "women", "unisex"],
    pool: (t) => (t === "budget" ? BLENDS.budget : t === "hero" ? BLENDS.heroEco : BLENDS.midEco),
  },
  shirts: {
    styles: ["Oxford Shirt", "Linen Shirt", "Flannel Shirt", "Overshirt", "Blouse", "Popover Shirt", "Camp Collar Shirt", "Chambray Shirt", "Utility Shirt"],
    fits: ["Regular", "Relaxed", "Slim", "Oversized"],
    base: 42,
    genders: ["men", "women"],
    pool: (t) => (t === "budget" ? BLENDS.budget : t === "hero" ? BLENDS.heroEco : BLENDS.midEco),
  },
  jeans: {
    styles: ["Straight Jeans", "Slim Jeans", "Wide-Leg Jeans", "Tapered Jeans", "Bootcut Jeans", "Mom Jeans", "Barrel Jeans", "Relaxed Jeans", "High-Rise Jeans"],
    fits: ["Slim", "Regular", "Relaxed", "Wide"],
    base: 55,
    genders: ["men", "women"],
    pool: (t) => (t === "budget" ? BLENDS.denimBudget : BLENDS.denimEco),
  },
  trousers: {
    styles: ["Chinos", "Pleated Trousers", "Cargo Trousers", "Drawstring Trousers", "Tailored Trousers", "Jogger", "Corduroy Trousers"],
    fits: ["Regular", "Slim", "Relaxed", "Wide"],
    base: 45,
    genders: ["men", "women", "unisex"],
    pool: (t) => (t === "budget" ? BLENDS.budget : t === "hero" ? BLENDS.heroEco : BLENDS.midEco),
  },
  dresses: {
    styles: ["Midi Dress", "Wrap Dress", "Shirt Dress", "Slip Dress", "Smock Dress", "Maxi Dress", "Tiered Dress", "Knitted Dress"],
    fits: ["Regular", "Relaxed", "Slim"],
    base: 65,
    genders: ["women"],
    pool: (t) => (t === "budget" ? BLENDS.budget : BLENDS.occasion),
  },
  skirts: {
    styles: ["Midi Skirt", "Pleated Skirt", "A-Line Skirt", "Slip Skirt", "Denim Skirt"],
    fits: ["Regular", "Slim"],
    base: 40,
    genders: ["women"],
    pool: (t) => (t === "budget" ? BLENDS.budget : BLENDS.occasion),
  },
  knitwear: {
    styles: ["Crew Jumper", "Roll Neck", "Cardigan", "Fisherman Jumper", "Zip-Through Knit", "Knitted Vest", "Turtleneck"],
    fits: ["Regular", "Relaxed", "Oversized", "Slim"],
    base: 70,
    genders: ["men", "women", "unisex"],
    pool: (t) => (t === "budget" ? BLENDS.knitBudget : BLENDS.knit),
  },
  hoodies: {
    styles: ["Pullover Hoodie", "Zip Hoodie", "Crew Sweatshirt", "Half-Zip Sweat"],
    fits: ["Regular", "Relaxed", "Oversized"],
    base: 48,
    genders: ["men", "women", "unisex"],
    pool: (t) => (t === "budget" ? BLENDS.budget : BLENDS.midEco),
  },
  activewear: {
    styles: ["Training Tee", "Run Shorts", "Leggings", "Sports Bra", "Track Jacket", "Base Layer", "Tank", "Cycling Shorts"],
    fits: ["Slim", "Regular", "Relaxed"],
    base: 38,
    genders: ["men", "women", "unisex"],
    pool: () => BLENDS.active,
  },
  outerwear: {
    styles: ["Chore Jacket", "Puffer Jacket", "Trench Coat", "Rain Shell", "Fleece Jacket", "Wool Coat", "Bomber Jacket", "Gilet"],
    fits: ["Regular", "Relaxed", "Oversized"],
    base: 110,
    genders: ["men", "women", "unisex"],
    pool: (t) => (t === "budget" ? BLENDS.budget : BLENDS.outer),
  },
  accessories: {
    styles: ["Beanie", "Scarf", "Tote Bag", "Cap", "Socks 3-Pack", "Belt"],
    fits: ["Regular"],
    base: 16,
    genders: ["unisex"],
    pool: (t) => (t === "budget" ? BLENDS.budget : BLENDS.heroEco),
  },
};

/* ── brand profiles ── */
interface BrandProfile {
  tier: "hero" | "mid" | "budget";
  mult: number;
  certs: string[];
  certChance: number;
  greenwash: number; // probability a product carries an unverified claim
  practices: Partial<Record<keyof Practices, number>>;
  counts: Partial<Record<string, number>>;
}
const DEFAULT_COUNTS: Record<string, number> = {
  "t-shirts": 26, shirts: 16, jeans: 13, trousers: 12, dresses: 14, skirts: 6,
  knitwear: 12, hoodies: 8, activewear: 6, outerwear: 10, accessories: 6,
};
const BRANDS: Record<string, BrandProfile> = {
  "people-tree": { tier: "hero", mult: 1.25, certs: ["GOTS", "Fair Wear Foundation", "OEKO-TEX Standard 100"], certChance: 0.9, greenwash: 0, practices: { natural_dye: 0.3, zero_waste: 0.2 }, counts: { activewear: 2 } },
  uniqlo: { tier: "mid", mult: 0.85, certs: ["RWS", "OEKO-TEX Standard 100"], certChance: 0.5, greenwash: 0.15, practices: {}, counts: { knitwear: 20, dresses: 8 } },
  seasalt: { tier: "hero", mult: 1.1, certs: ["European Flax", "OEKO-TEX Standard 100"], certChance: 0.75, greenwash: 0.05, practices: { natural_dye: 0.15 }, counts: { activewear: 2 } },
  "marks-and-spencer": { tier: "mid", mult: 0.95, certs: ["GRS", "BCI", "OEKO-TEX Standard 100"], certChance: 0.6, greenwash: 0.2, practices: { take_back: 0.3 }, counts: {} },
  thought: { tier: "hero", mult: 1.1, certs: ["GOTS", "OEKO-TEX Standard 100"], certChance: 0.8, greenwash: 0.05, practices: { natural_dye: 0.2 }, counts: { activewear: 2 } },
  patagonia: { tier: "hero", mult: 1.5, certs: ["OCS", "SA8000", "Bluesign"], certChance: 0.85, greenwash: 0, practices: { repair_program: 0.8, pfc_free: 0.5, take_back: 0.4 }, counts: { outerwear: 22, activewear: 14, dresses: 3, skirts: 0 } },
  zara: { tier: "budget", mult: 1.0, certs: ["OEKO-TEX Standard 100"], certChance: 0.2, greenwash: 0.4, practices: {}, counts: { dresses: 22, skirts: 10 } },
  "sweaty-betty": { tier: "mid", mult: 1.35, certs: ["GRS", "OEKO-TEX Standard 100"], certChance: 0.7, greenwash: 0.1, practices: { pfc_free: 0.3 }, counts: { activewear: 44, "t-shirts": 16, jeans: 2, shirts: 4, dresses: 4, knitwear: 4, outerwear: 6 } },
  "h-and-m": { tier: "budget", mult: 0.55, certs: ["BCI"], certChance: 0.5, greenwash: 0.6, practices: { take_back: 0.2 }, counts: { "t-shirts": 30, dresses: 20 } },
  "and-other-stories": { tier: "mid", mult: 1.25, certs: ["GOTS", "OEKO-TEX Standard 100"], certChance: 0.35, greenwash: 0.25, practices: { deadstock: 0.1 }, counts: { dresses: 22, skirts: 12, jeans: 8 } },
  finisterre: { tier: "hero", mult: 1.4, certs: ["Bluesign", "1% for the Planet", "GRS"], certChance: 0.8, greenwash: 0, practices: { pfc_free: 0.7, repair_program: 0.4 }, counts: { outerwear: 22, activewear: 12, dresses: 4, skirts: 0 } },
  cos: { tier: "mid", mult: 1.2, certs: ["OEKO-TEX Standard 100"], certChance: 0.45, greenwash: 0.15, practices: { zero_waste: 0.1 }, counts: { dresses: 18 } },
};

const GREENWASH_TEMPLATES = [
  "'Conscious collection' label with no certification behind it",
  "Described as 'eco-friendly' with no verifiable standard",
  "'Planet-positive' claim with no supporting evidence",
  "'Sustainably sourced' with no traceability information",
  "'Responsible choice' tag without any third-party audit",
];

const NO_PRACTICES: Practices = {
  natural_dye: false, undyed: false, deadstock: false, pfc_free: false,
  repair_program: false, take_back: false, zero_waste: false, made_to_order: false,
};

function compText(parts: FabricPart[]): string {
  return parts.map((p) => `${p.pct}% ${p.label.toLowerCase()}`).join(", ");
}

function makeExplanation(parts: FabricPart[], certs: string[], greenwash: string[]): string {
  const dominant = [...parts].sort((a, b) => b.pct - a.pct)[0];
  const note = MATERIAL_NOTES[dominant.material];
  const certBit =
    certs.length > 0
      ? ` Certified ${certs.slice(0, 2).join(" and ")}, which independently verifies the claim.`
      : " No third-party certification backs the fabric claims.";
  const flagBit = greenwash.length > 0 ? " Some marketing language on this item couldn't be verified." : "";
  return `Made mainly of ${dominant.label.toLowerCase()} — ${note}${certBit}${flagBit}`;
}

async function main() {
  const brandsDoc = JSON.parse(readFileSync(resolve(process.cwd(), "data/raw/brands.json"), "utf8"));
  const brandMeta = new Map<string, { name: string; website: string; certifications: string[]; ethics_modifier: number }>(
    brandsDoc.brands.map((b: { slug: string; name: string; website: string; certifications: string[]; ethics_modifier: number }) => [b.slug, b]),
  );

  const products: SeedProduct[] = [];

  for (const [brandSlug, profile] of Object.entries(BRANDS)) {
    const meta = brandMeta.get(brandSlug);
    if (!meta) throw new Error(`Brand ${brandSlug} missing from brands.json`);

    const usedTitles = new Set<string>();
    for (const [cat, def] of Object.entries(CATS)) {
      const count = profile.counts[cat] ?? DEFAULT_COUNTS[cat] ?? 0;
      for (let i = 0; i < count; i++) {
        const id = `${brandSlug}-${cat}-${i + 1}`;
        const rnd = mulberry32(hash(id));

        // re-roll style/image/fit until the title is unique within the brand
        let style = "", fit = "", img = "", colorName = "", titleTry = "";
        for (let attempt = 0; attempt < 8; attempt++) {
          style = pick(rnd, def.styles);
          fit = pick(rnd, def.fits);
          [img, colorName] = pick(rnd, IMG[cat]);
          titleTry = `${style}|${colorName}|${fit}`;
          if (!usedTitles.has(titleTry)) break;
        }
        usedTitles.add(titleTry);

        const gender = pick(rnd, def.genders);
        const blend = pick(rnd, def.pool(profile.tier));
        const parts: FabricPart[] = blend.map(([m, pct]) => ({
          material: m,
          label: MATERIAL_LABELS[m],
          pct,
        }));

        const certs = profile.certs.filter(() => rnd() < profile.certChance);
        const practices: Practices = { ...NO_PRACTICES };
        for (const [k, p] of Object.entries(profile.practices)) {
          if (rnd() < (p ?? 0)) practices[k as keyof Practices] = true;
        }
        const greenwash = rnd() < profile.greenwash ? [pick(rnd, GREENWASH_TEMPLATES)] : [];

        const { score, grade, factors } = computeScore({
          fabric_composition: parts,
          certifications: certs,
          practices,
          brand_ethics_modifier: meta.ethics_modifier,
        });

        const price = Math.max(6, Math.round(def.base * profile.mult * (0.8 + rnd() * 0.55)));
        const fitPrefix = fit !== "Regular" && rnd() < 0.7 ? `${fit} ` : "";
        const dominant = parts[0];
        // never repeat the fabric word already in the style ("Linen Linen Shirt")
        const adjWord = dominant.label.split(" ")[0].toLowerCase();
        const fabricAdj =
          rnd() < 0.5 && !style.toLowerCase().includes(adjWord) ? `${dominant.label} ` : "";
        const title = `${fitPrefix}${fabricAdj}${style} — ${colorName}`;
        const retailer = pick(rnd, ["ASOS", "John Lewis", "Zalando", "Brand Direct"]);

        const certText = certs.length > 0 ? ` ${certs[0]}-certified fabric.` : "";
        const description =
          `${style} in ${compText(parts)}. ${MATERIAL_NOTES[dominant.material]}${certText} ` +
          `${fit} fit. Machine wash cool, line dry.`;

        products.push({
          id,
          brand_slug: brandSlug,
          title,
          description,
          category: cat,
          gender,
          price,
          currency: "GBP",
          retailer,
          buy_url: `${meta.website}/products/${id}`,
          image_url: `https://images.unsplash.com/${img}?auto=format&fit=crop&w=900&h=1200&q=80`,
          color: colorName,
          color_family: colorFamily(colorName),
          sizes: sizesFor(id, cat),
          fit,
          source: "generated",
          fabric_composition: parts,
          sustainability: {
            score,
            grade,
            factors,
            explanation: makeExplanation(parts, certs, greenwash),
            greenwash_flags: greenwash,
            certifications: certs,
            practices,
          },
        });
      }
    }
  }

  writeFileSync(
    resolve(process.cwd(), "data/products_generated.json"),
    JSON.stringify({ products }, null, 1),
  );

  // patch fit + source onto the 67 AI-enriched originals
  const seedPath = resolve(process.cwd(), "data/products_seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  for (const p of seed.products) {
    if (!p.fit) p.fit = fitFor(p.title);
    if (!p.source) p.source = "extracted";
  }
  writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  const perBrand = new Map<string, number>();
  for (const p of products) perBrand.set(p.brand_slug, (perBrand.get(p.brand_slug) ?? 0) + 1);
  console.log(`✓ Generated ${products.length} products (+ ${seed.products.length} originals patched with fit)`);
  for (const [b, n] of perBrand) console.log(`   ${b}: ${n}`);
  const grades = new Map<string, number>();
  for (const p of products) grades.set(p.sustainability.grade, (grades.get(p.sustainability.grade) ?? 0) + 1);
  console.log(`   grades: ${JSON.stringify(Object.fromEntries([...grades.entries()].sort()))}`);
}

main();
