import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */

  // Use Webpack for builds (Turbopack has path resolution issues)
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    return config;
  },

  // Explicitly set turbopack root to resolve workspace inference issues
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
