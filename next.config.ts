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
    ],
  },
};

export default nextConfig;
