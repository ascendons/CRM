import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configure Turbopack (default in Next.js 16)
  turbopack: {
    resolveAlias: {
      '@': './',
      '@/*': './*',
    },
  },
};

export default nextConfig;
