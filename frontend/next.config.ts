import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for AWS Amplify SSR deployment
  output: 'standalone',

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

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    return [
      {
        source: '/crm-backend/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
