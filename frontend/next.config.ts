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

  // Explicitly empty turbopack config to avoid errors
  turbopack: {},
};

export default nextConfig;
