/**
 * Real, working outbound links for the demo brands. We don't have true
 * product deeplinks (demo catalog), so "View on brand site" opens the
 * brand's own site with the garment searched — which genuinely resolves to
 * their real listings. Unknown brands fall back to a scoped web search.
 */

interface BrandLink {
  home: string;
  search: (term: string) => string;
}

const BRANDS: Record<string, BrandLink> = {
  "people-tree": { home: "https://www.peopletree.co.uk", search: (t) => `https://www.peopletree.co.uk/catalogsearch/result/?q=${t}` },
  uniqlo: { home: "https://www.uniqlo.com/uk/en/", search: (t) => `https://www.uniqlo.com/uk/en/search?q=${t}` },
  seasalt: { home: "https://www.seasaltcornwall.com", search: (t) => `https://www.seasaltcornwall.com/search?q=${t}` },
  "marks-and-spencer": { home: "https://www.marksandspencer.com", search: (t) => `https://www.marksandspencer.com/l/search?searchTerm=${t}` },
  thought: { home: "https://www.wearethought.com", search: (t) => `https://www.wearethought.com/search?q=${t}` },
  patagonia: { home: "https://www.patagonia.com", search: (t) => `https://www.patagonia.com/search/?q=${t}` },
  zara: { home: "https://www.zara.com/uk/en/", search: (t) => `https://www.zara.com/uk/en/search?searchTerm=${t}` },
  "sweaty-betty": { home: "https://www.sweatybetty.com", search: (t) => `https://www.sweatybetty.com/search?q=${t}` },
  "h-and-m": { home: "https://www2.hm.com/en_gb/", search: (t) => `https://www2.hm.com/en_gb/search-results.html?q=${t}` },
  "and-other-stories": { home: "https://www.stories.com/en_gbp/", search: (t) => `https://www.stories.com/en_gbp/search.html?q=${t}` },
  finisterre: { home: "https://finisterre.com", search: (t) => `https://finisterre.com/search?q=${t}` },
  cos: { home: "https://www.cos.com/en_gbp/", search: (t) => `https://www.cos.com/en_gbp/search.html?q=${t}` },
};

/** Strip the "— Colour" suffix and leading fit word for a cleaner query. */
function searchTerm(title: string): string {
  return title
    .split("—")[0]
    .replace(/^(Slim|Relaxed|Oversized|Wide|Regular)\s+/i, "")
    .trim();
}

export function viewOnBrandUrl(brandSlug: string, brandName: string, title: string): string {
  const term = searchTerm(title);
  const b = BRANDS[brandSlug];
  if (b) return b.search(encodeURIComponent(term));
  return `https://www.google.com/search?q=${encodeURIComponent(`${brandName} ${term}`)}`;
}
