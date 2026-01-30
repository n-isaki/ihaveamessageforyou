import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Statischer Export für Firebase Hosting
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
