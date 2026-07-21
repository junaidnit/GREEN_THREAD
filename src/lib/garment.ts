/**
 * Garment attribute engine — the vocabulary the matcher needs to answer
 * "the SAME item, in a better fabric".
 *
 * The product's category ("t-shirts") is far too coarse for that promise: it
 * lumps a polo, a tee, a tank and a camisole into one bucket, which is how a
 * navy men's polo ended up being offered a pink camisole. Everything here is
 * derived from the title, which is the one field every feed gets right —
 * stored `color`/`gender` fields are frequently wrong (see repair-attrs.ts).
 *
 * Pure functions, no I/O: unit-tested against real catalog titles.
 */

export type GarmentType =
  | "polo" | "tee" | "tank" | "henley" | "sweatshirt" | "hoodie" | "baselayer"
  | "shirt" | "blouse"
  | "dress" | "jumpsuit" | "skirt"
  | "jeans" | "trousers" | "shorts" | "leggings" | "dungarees"
  | "jumper" | "cardigan"
  | "jacket" | "coat" | "gilet"
  | "socks" | "scarf" | "hat" | "gloves" | "belt" | "bag" | "underwear" | "swimwear"
  | "homeware"
  | "other";

export type Pattern = "check" | "stripe" | "floral" | "print" | "spot" | "plain";

export type Gender = "men" | "women" | "unisex";

/**
 * Ordered most-specific-first: the first hit wins, so "polo shirt" is a polo,
 * not a shirt, and "denim jacket" is a jacket, not jeans.
 */
const TYPE_RULES: Array<[RegExp, GarmentType]> = [
  // homeware first: a "Knitted Cushion Cover" is homeware, not a jumper —
  // the object noun must beat fabric-process words like "knitted"
  [/\bcushion\b|\bblanket\b|\bapron\b|\btea ?towel\b|\bnapkin\b|\bplacemat\b/i, "homeware"],
  [/\bpolo\b/i, "polo"],
  [/\bhenley\b/i, "henley"],
  [/\bcamisole\b|\bcami\b|\bbralette\b|\bslip top\b/i, "tank"],
  [/\bgilet\b|\bbodywarmer\b/i, "gilet"], // before "vest": a gilet is not a tank
  [/\btank\b|\bvests?\b|\bsleeveless top\b|\bstrappy\b/i, "tank"], // UK "vest" = tank
  [/\bhoodie\b|\bhooded\b/i, "hoodie"],
  [/\bbase ?layer\b/i, "baselayer"], // next-to-skin thermal top/legging
  [/\bsweatshirt\b|\bsweat\b|\bcrew ?neck sweat|\bfleece\b/i, "sweatshirt"],
  [/\bdungarees?\b|\boveralls?\b/i, "dungarees"],
  [/\bjumpsuit\b|\bplaysuit\b|\bboilersuit\b/i, "jumpsuit"],
  [/\bdress\b|\bkaftan\b|\bpinafore\b/i, "dress"],
  [/\bskirt\b/i, "skirt"],
  [/\bjeans\b|\bdenim trouser/i, "jeans"],
  [/\bleggings?\b|\bjeggings?\b|\btights\b/i, "leggings"],
  [/\bshorts\b/i, "shorts"],
  [/\btrousers?\b|\bchinos?\b|\bpants\b|\bculottes?\b|\bjoggers?\b|\bcargo\b/i, "trousers"],
  [/\bcardigan\b|\bcardi\b/i, "cardigan"],
  [/\bjumper\b|\bsweater\b|\bpullover\b|\bknit\b|\bknitted\b/i, "jumper"],
  [/\bcoat\b|\bparka\b|\bmac\b|\btrench\b/i, "coat"],
  [/\bjacket\b|\bblazer\b|\bbomber\b|\bblouson\b|\banorak\b|\bshacket\b/i, "jacket"],
  [/\bblouse\b/i, "blouse"],
  [/\bshirt\b(?!s?\s*dress)/i, "shirt"], // after polo/tee so "polo shirt" is caught above
  [/\bt-?shirt\b|\btee\b|\btop\b/i, "tee"],
  [/\bsocks?\b/i, "socks"],
  [/\bscarf\b|\bsnood\b/i, "scarf"],
  [/\bhat\b|\bbeanie\b|\bcap\b|\bberet\b/i, "hat"],
  [/\bgloves?\b|\bmittens?\b/i, "gloves"],
  [/\bbelt\b/i, "belt"],
  [/\bbag\b|\btote\b|\bbackpack\b|\bwashbag\b|\bbumbag\b|\bpouch\b/i, "bag"],
  [/\bbriefs?\b|\bboxers?\b|\bknickers\b|\bthong\b|\bbra\b/i, "underwear"],
  [/\bswim|\bbikini\b|\btrunks\b/i, "swimwear"],
];

/** Coarse feed categories, for titles that name no garment at all. */
const CATEGORY_TYPE: Record<string, GarmentType> = {
  "t-shirts": "tee",
  shirts: "shirt",
  dresses: "dress",
  skirts: "skirt",
  jeans: "jeans",
  trousers: "trousers",
  hoodies: "hoodie",
  knitwear: "jumper",
  outerwear: "jacket",
};

/**
 * A t-shirt is not a polo. This is the matcher's hardest gate.
 *
 * The title decides; `category` is only a fallback. They must not be merged:
 * the feed files "KARDA Organic Cotton Denim Shirt" under category "jeans"
 * (its mapper keys off "denim"), and matching the joined string turned a
 * shirt into a pair of jeans.
 */
export function garmentType(title: string, category = ""): GarmentType {
  for (const [re, type] of TYPE_RULES) if (re.test(title)) return type;
  return CATEGORY_TYPE[category.toLowerCase()] ?? "other";
}

/** Shopper-facing noun for a type — "the same polo, better fabric". */
const TYPE_LABEL: Record<GarmentType, string> = {
  polo: "polo", tee: "tee", tank: "vest", henley: "henley",
  sweatshirt: "sweatshirt", hoodie: "hoodie", baselayer: "base layer",
  shirt: "shirt", blouse: "blouse",
  dress: "dress", jumpsuit: "jumpsuit", skirt: "skirt",
  jeans: "jeans", trousers: "trousers", shorts: "shorts",
  leggings: "leggings", dungarees: "dungarees",
  jumper: "jumper", cardigan: "cardigan",
  jacket: "jacket", coat: "coat", gilet: "gilet",
  socks: "socks", scarf: "scarf", hat: "hat", gloves: "gloves",
  belt: "belt", bag: "bag", underwear: "piece", swimwear: "swimwear",
  homeware: "piece",
  other: "piece",
};

export function garmentLabel(title: string, category = ""): string {
  return TYPE_LABEL[garmentType(title, category)];
}

const PATTERN_RULES: Array<[RegExp, Pattern]> = [
  [/\bcheck(ed)?\b|\bgingham\b|\bplaid\b|\btartan\b|\bwindowpane\b/i, "check"],
  [/\bstripe[ds]?\b|\bbreton\b|\bpinstripe\b|\bpointelle stripe\b/i, "stripe"],
  [/\bfloral\b|\bflower\b|\bditsy\b|\bbotanical\b/i, "floral"],
  [/\bspot(ted|s)?\b|\bpolka\b|\bdots?\b/i, "spot"],
  [/\bprint(ed)?\b|\bgraphic\b|\bpaisley\b|\bleopard\b|\banimal\b|\bcamo\b|\bpattern(ed)?\b/i, "print"],
];

export function patternOf(title: string): Pattern {
  for (const [re, p] of PATTERN_RULES) if (re.test(title)) return p;
  return "plain";
}

/**
 * Colour families. Word-boundary anchored on purpose: the old regex used a
 * bare /ink/, which matched "P-INK" and filed every pink garment as black.
 */
const COLOUR_RULES: Array<[RegExp, string]> = [
  [/\bmulti\b|\bmixed\b|\brainbow\b|\bassorted\b/i, "Multi"],
  [/\bblack\b|\bcharcoal\b|\bgraphite\b|\bmidnight\b|\bjet\b|\bonyx\b|\bink\b/i, "Black"],
  [/\bwhite\b|\becru\b|\bcream\b|\bivory\b|\bnatural\b|\boat(meal)?\b|\bpearl\b|\bchalk\b|\bundyed\b|\bcloud\b|\bchampagne\b|\bbone\b/i, "White & Cream"],
  [/\bgrey\b|\bgray\b|\bsilver\b|\bheather\b|\bmelange\b|\bmarl\b|\bbasalt\b|\bslate\b|\bash\b/i, "Grey"],
  [/\bnavy\b|\bblue\b|\bindigo\b|\bdenim\b|\bsky\b|\bcobalt\b|\bteal\b|\bstorm\b|\bazure\b|\bcoastal\b|\badriatic\b/i, "Blue"],
  [/\bgreen\b|\bsage\b|\bmoss\b|\bolive\b|\bforest\b|\bemerald\b|\bkhaki\b|\blichen\b|\bmint\b|\bpine\b/i, "Green"],
  [/\bbrown\b|\btan\b|\bcamel\b|\bsand\b|\bstone\b|\bbeige\b|\bchocolate\b|\bwalnut\b|\btobacco\b|\bclay\b|\btaupe\b|\bmushroom\b|\bbiscuit\b/i, "Brown & Tan"],
  [/\bpink\b|\bblush\b|\brose\b|\blilac\b|\blavender\b|\bpurple\b|\bviolet\b|\bplum\b|\bfuchsia\b|\bmauve\b|\bberry\b|\bmagenta\b/i, "Pink & Purple"],
  [/\bred\b|\bburgundy\b|\bwine\b|\bmaroon\b|\bcoral\b|\borange\b|\bember\b|\bterracotta\b|\brust\b|\bcrimson\b|\bginger\b|\bpoppy\b|\bradish\b/i, "Red & Orange"],
  [/\byellow\b|\bmustard\b|\bgold\b|\bochre\b|\bbutter\b|\bsaffron\b/i, "Yellow"],
];

/**
 * Every colour family named in the text. Garment names are routinely
 * two-toned ("Navy & White Check"), so a single label can't represent them:
 * picking one made "Navy & White" and "White & Blue" look like different
 * colours. Callers compare sets and treat an overlap as a colour match.
 */
export function colourFamilies(...texts: string[]): Set<string> {
  const t = texts.filter(Boolean).join(" ");
  const out = new Set<string>();
  for (const [re, fam] of COLOUR_RULES) if (re.test(t)) out.add(fam);
  return out;
}

/**
 * The dominant colour family — the one named first ("Navy & White" → Blue),
 * for display. Returns null when no colour word is present: the caller
 * decides how to treat a miss rather than being handed a wrong answer.
 */
export function colourFamily(...texts: string[]): string | null {
  const t = texts.filter(Boolean).join(" ");
  let best: { fam: string; at: number } | null = null;
  for (const [re, fam] of COLOUR_RULES) {
    const at = t.search(re);
    if (at >= 0 && (best === null || at < best.at)) best = { fam, at };
  }
  return best?.fam ?? null;
}

/** Do two garments share a colour? Overlapping families count. */
export function colourMatch(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  if (a.has("Multi") || b.has("Multi")) return true;
  for (const fam of a) if (b.has(fam)) return true;
  return false;
}

/** The colour word itself, for display ("Adriatic Blue" → "Blue"). */
export function colourWord(...texts: string[]): string | null {
  const t = texts.filter(Boolean).join(" ");
  for (const [re] of COLOUR_RULES) {
    const m = t.match(re);
    if (m) return m[0][0].toUpperCase() + m[0].slice(1).toLowerCase();
  }
  return null;
}

/** Garment types that are womenswear regardless of how a feed tags them. */
const WOMENS_TYPES = new Set<GarmentType>(["dress", "skirt", "blouse", "jumpsuit"]);

/**
 * WORD BOUNDARIES ARE LOAD-BEARING. "womenswear" contains "menswear" as a
 * substring: an unanchored /menswear/ filed 339 women's Komodo pieces as
 * menswear, because that brand tags nearly everything "womenswear".
 */
const WOMENS_WORDS = /\bwomen'?s?\b|\bwomenswear\b|\bladies\b|\bwomans?\b/i;
const MENS_WORDS = /\bmen'?s?\b|\bmenswear\b|\bgents\b/i;

/**
 * Feeds mislabel gender constantly (42 dresses and skirts arrived tagged
 * "men"). Explicit wording in the title wins; then the garment type; then
 * feed metadata such as product_type and tags — where a signal for BOTH
 * genders means the brand tags broadly, so the honest answer is unisex.
 *
 * This is the only gender authority. Do not reimplement it at an ingestion
 * boundary: that is exactly how the men's section filled with dresses.
 */
export function genderFor(
  title: string,
  type: GarmentType,
  feedGender?: string,
  hints = "",
): Gender {
  if (WOMENS_WORDS.test(title)) return "women";
  if (MENS_WORDS.test(title)) return "men";
  if (/\bunisex\b/i.test(title)) return "unisex";
  if (WOMENS_TYPES.has(type)) return "women";
  if (/\bcamisole\b|\bbralette\b|\bknickers\b|\bbra\b/i.test(title)) return "women";

  if (hints) {
    if (/\bunisex\b/i.test(hints)) return "unisex";
    const w = WOMENS_WORDS.test(hints);
    const m = MENS_WORDS.test(hints);
    if (w && m) return "unisex"; // tagged for both — claim neither
    if (w) return "women";
    if (m) return "men";
  }

  return feedGender === "men" || feedGender === "women" ? feedGender : "unisex";
}

export function genderCompatible(a: Gender, b: Gender): boolean {
  return a === "unisex" || b === "unisex" || a === b;
}
