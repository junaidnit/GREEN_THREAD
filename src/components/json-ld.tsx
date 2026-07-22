import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Structured data. The site published none, which meant no rich results and, * more importantly for this business, nothing an answer engine could cite.
 *
 * The Dataset block is the one that matters most: the truth ledger is a real
 * primary source (timestamped fibre readings with change history) and this is
 * what makes it machine-discoverable rather than prose inside React.
 */
function Json({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is not HTML; escape the one sequence that could
      // close the script tag early
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function SiteJsonLd({ ledger }: { ledger?: { products: number; readings: number; since: string } }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: `${SITE_URL}/icon.svg`,
    foundingDate: "2026",
    areaServed: "GB",
    // A named founder is a strong entity signal: it lets an answer engine
    // connect the brand to a person, and this one to a mohair family that has
    // been working natural fibres since 1967.
    founder: {
      "@type": "Person",
      name: "Anita Barnard",
      jobTitle: "Founder",
    },
    knowsAbout: [
      "natural fibre clothing",
      "fabric composition",
      "textile greenwashing",
      "EU Digital Product Passport",
      "organic cotton",
      "linen",
      "hemp",
      "merino wool",
      "TENCEL lyocell",
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-GB",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const dataset = ledger && {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE_URL}/#truth-ledger`,
    name: "The Fibre Set truth ledger",
    description:
      `An independent, append-only record of the disclosed fibre composition of real clothing. ` +
      `${ledger.readings.toLocaleString("en-GB")} verified readings across ` +
      `${ledger.products.toLocaleString("en-GB")} products, each timestamped, with change history ` +
      `when a brand alters what it discloses.`,
    url: `${SITE_URL}/label-watch`,
    creator: { "@id": `${SITE_URL}/#organization` },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    temporalCoverage: `${ledger.since.slice(0, 10)}/..`,
    measurementTechnique:
      "Fibre composition as disclosed by the brand on its own product page, parsed and recorded verbatim.",
    variableMeasured: [
      "fibre composition (percentage by fibre)",
      "oil-derived (plastic) percentage",
      "first-seen date",
      "composition changes over time",
    ],
    keywords: ["fibre composition", "greenwashing", "textiles", "sustainable fashion", "UK retail"],
  };

  return (
    <>
      <Json data={organization} />
      <Json data={website} />
      {dataset && <Json data={dataset} />}
    </>
  );
}

/** Product page markup, enables rich results on 1,300+ pages. */
export function ProductJsonLd({
  id, name, brand, image, price, currency, url, description, materials,
}: {
  id: string; name: string; brand: string; image?: string | null; price: number;
  currency: string; url: string; description?: string;
  materials: Array<{ label: string; pct: number }>;
}) {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${SITE_URL}/product/${id}#product`,
        name,
        brand: { "@type": "Brand", name: brand },
        ...(image ? { image: [image] } : {}),
        ...(description ? { description } : {}),
        material: materials.map((m) => `${m.pct}% ${m.label}`).join(", "),
        offers: {
          "@type": "Offer",
          price,
          priceCurrency: currency,
          availability: "https://schema.org/InStock",
          url,
        },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      }}
    />
  );
}

/** Magazine + condition pages: an article with a real author and date. */
export function ArticleJsonLd({
  headline, description, path, image, published,
}: {
  headline: string; description: string; path: string; image?: string | null; published: string;
}) {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        ...(image ? { image: [image] } : {}),
        datePublished: published,
        dateModified: published,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: `${SITE_URL}${path}`,
        inLanguage: "en-GB",
      }}
    />
  );
}
