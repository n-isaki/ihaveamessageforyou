import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kein statischer Export wegen dynamischen Routen
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
