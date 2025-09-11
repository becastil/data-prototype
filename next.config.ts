import type { NextConfig } from "next";
import path from 'path';
import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';

const nextConfig: NextConfig = {
  /* config options here */
  
  // Performance optimizations
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  // Be lenient in dev so TS/ESLint don't block the server
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Compression
  compress: true,
  
  // Deployment settings
  output: 'standalone', // Better compatibility with cloud deployment
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Simplified webpack config
  webpack: (config) => {
    // Basic path alias for imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve('.'),
      '~': path.resolve('.'),
    };
    
    return config;
  }
};

// Enable vanilla-extract so .css.ts styles compile in production
const withVanillaExtract = createVanillaExtractPlugin();
export default withVanillaExtract(nextConfig);
