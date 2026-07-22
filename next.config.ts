import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // absolute project root, taken from this config file's real location —
    // process.cwd() lies when the dev server is spawned from another directory
    PROJECT_ROOT: __dirname,
  },
  // bundle the catalog + twin index into serverless functions: these are read
  // with dynamically-joined paths the file tracer can't follow
  /**
   * Scoped per route, not "everything everywhere".
   *
   * `./data/*.json` bundled all 7.8 MB into EVERY serverless function,
   * including the 4.7 MB visual-twins index that only the product page reads.
   * The extension's scan endpoint was carrying it too, and a cold start took
   * 42 seconds, past the panel's timeout, so the first scan after an idle
   * period always failed with "that took longer than it should".
   *
   * Only the four files actually read at runtime are traced, and the big one
   * only where it's used.
   */
  outputFileTracingIncludes: {
    "/**": [
      "./data/products_live.json",
      "./data/truth-ledger.json",
      "./data/raw/brands.json",
    ],
    "/product/[id]": ["./data/twins.json"],
  },
  experimental: {
    // native View Transitions: product card image morphs into the PDP hero
    viewTransition: true,
  },
  // The brand is now The Fibre Set. greenthread.info is retired but still
  // registered, so send it — and every old inbound link — to the same path on
  // the new domain with a permanent (308) redirect. That passes search ranking
  // across instead of leaving a duplicate copy of the site on the old name.
  // Kept here rather than in the Vercel dashboard so it lives in version
  // control; safe to delete once the old domain lapses.
  //
  // /api is EXCLUDED on purpose. A CORS preflight may not follow a redirect —
  // the browser reports a bare "Failed to fetch" — so redirecting the API
  // broke every already-installed extension that had the old host saved.
  // Copies of the extension are already in the wild; keep their endpoint
  // answering until the domain lapses.
  async redirects() {
    return [
      // The Journal is now the Magazine. Anything already linking to or
      // indexing /journal keeps working, and the ranking transfers.
      { source: "/journal", destination: "/magazine", permanent: true },
      { source: "/journal/:path*", destination: "/magazine/:path*", permanent: true },
      ...["greenthread.info", "www.greenthread.info"].map((host) => ({
        source: "/:path((?!api/).*)",
        has: [{ type: "host" as const, value: host }],
        destination: "https://thefibreset.com/:path",
        permanent: true,
      })),
    ];
  },
  images: {
    // Next 16 only honours a `quality` prop whose value is listed here; any
    // other value silently falls back to 75. Every quality={88}/{90} on the
    // site was being ignored until this was added, which I only caught by
    // reading q= on the deployed page.
    qualities: [75, 88, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // live-ingested product photos (Shopify-hosted brand stores)
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.shopify.com",
      },
    ],
  },
};

export default nextConfig;
