import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { MATERIAL_LABELS } from "@/lib/scoring";
import { CONDITIONS } from "@/lib/conditions";
import { SITE_URL } from "@/lib/site";
import type { MaterialId } from "@/lib/types";

/**
 * There were over 1,300 live product pages and no machine-readable index of
 * any of them, search engines were discovering the catalogue only by
 * crawling internal links, so the deep pages that would rank for long-tail
 * queries ("100% linen dress uk") may never have been found at all.
 *
 * Priorities are ordered by what we actually want ranking: the evidence pages
 * (Label Watch, methodology, fibre guides, condition edits) above individual
 * products, because those are the pages only we can write.
 */
export const dynamic = "force-dynamic";
// The catalogue read is too slow to prerender (1,300+ rows over the network
// timed the build out at 60s). Rendered on request instead and cached at the
// edge, these endpoints are fetched by crawlers, not by people.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const url = (path: string) => `${SITE_URL}${path}`;

  const core: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/label-watch"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/methodology"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/magazine"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/conditions"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/extension"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/brands"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/search"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: url("/analyze"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/children"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: url("/home"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: url("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/support"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const fabrics: MetadataRoute.Sitemap = (Object.keys(MATERIAL_LABELS) as MaterialId[]).map((m) => ({
    url: url(`/fabric/${m}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const conditions: MetadataRoute.Sitemap = Object.keys(CONDITIONS).map((slug) => ({
    url: url(`/condition/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  let products: MetadataRoute.Sitemap = [];
  let brands: MetadataRoute.Sitemap = [];
  try {
    const catalog = await getCatalog();
    products = catalog.map((p) => ({
      url: url(`/product/${p.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    brands = [...new Set(catalog.map((p) => p.brand.slug))].map((slug) => ({
      url: url(`/brand/${slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // a catalogue read failure must not take the whole sitemap down, // the static routes above are still worth serving
  }

  return [...core, ...fabrics, ...conditions, ...brands, ...products];
}
