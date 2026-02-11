import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Configure Turbopack (default in Next.js 16)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, './'),
    },
  },
};

export default nextConfig;
