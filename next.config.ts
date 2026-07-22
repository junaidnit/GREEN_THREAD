import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // absolute project root, taken from this config file's real location —
    // process.cwd() lies when the dev server is spawned from another directory
    PROJECT_ROOT: __dirname,
  },
  // bundle the catalog + twin index into serverless functions: these are read
  // with dynamically-joined paths the file tracer can't follow
  outputFileTracingIncludes: {
    "/**": ["./data/*.json", "./data/raw/*.json"],
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
