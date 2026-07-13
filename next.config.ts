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
