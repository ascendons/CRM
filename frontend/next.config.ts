import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable turbopack for builds due to path resolution issues
    turbo: undefined,
  },
  // Ensure proper module resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './'),
    };
    return config;
  },
};

export default nextConfig;
