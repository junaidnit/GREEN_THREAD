import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
