import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable static export for AWS Amplify deployment
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

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

  // Note: rewrites don't work with static export
  // API calls will go directly to NEXT_PUBLIC_API_URL
};

export default nextConfig;
