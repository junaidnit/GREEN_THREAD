/**
 * "Find it secondhand", real, working search deeplinks into the UK's main
 * resale platforms. Honest approach for a demo: we can't index their stock,
 * but we can land the shopper on a live search for this exact garment.
 */

export interface ResalePlatform {
  name: string;
  tagline: string;
  search: (term: string) => string;
}

export const RESALE_PLATFORMS: ResalePlatform[] = [
  {
    name: "Vinted",
    tagline: "UK's biggest secondhand wardrobe",
    search: (t) => `https://www.vinted.co.uk/catalog?search_text=${t}`,
  },
  {
    name: "eBay",
    tagline: "New & pre-loved, buyer protected",
    search: (t) => `https://www.ebay.co.uk/sch/i.html?_nkw=${t}&LH_ItemCondition=3000`,
  },
  {
    name: "Depop",
    tagline: "Curated resale, fashion-first",
    search: (t) => `https://www.depop.com/search/?q=${t}`,
  },
  {
    name: "Vestiaire Collective",
    tagline: "Authenticated designer resale",
    search: (t) => `https://www.vestiairecollective.com/search/?q=${t}`,
  },
];

/** Compact search term: brand + de-coloured title. */
export function resaleTerm(brandName: string, title: string): string {
  const base = title.split(", ")[0].replace(/^(Slim|Relaxed|Oversized|Wide|Regular)\s+/i, "").trim();
  return encodeURIComponent(`${brandName} ${base}`);
}
