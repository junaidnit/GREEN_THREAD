import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * There was no robots.txt at all (404), so crawlers had no guidance and no
 * pointer to the sitemap.
 *
 * AI crawlers are deliberately ALLOWED. The whole GEO thesis is that we want
 * to be the source an assistant cites when someone asks whether a garment is
 * really linen — blocking them would be arguing against our own strategy.
 * What we do block is the parameterised search space and the private,
 * device-local pages, which have nothing to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/out/", // affiliate redirects — never a landing page
          "/retailer/",
          "/saved", // lives in the visitor's own browser storage
          "/diary",
          "/search?", // facet permutations; /search itself stays indexable
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
