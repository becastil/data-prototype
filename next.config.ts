import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';
import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import path from 'path';

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
  
  // Windows compatibility settings
  output: 'standalone', // Better compatibility with Windows deployment
  
  // PowerShell output settings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Use esbuild-loader for faster client prod builds
  webpack: (config, { dev, isServer }) => {
    // Windows path handling - normalize path separators
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve('.'),
      '~': path.resolve('.'),
    };
    
    // Ensure consistent path handling across platforms
    config.resolve.modules = [
      path.resolve('./node_modules'),
      'node_modules'
    ];
    
    if (!dev && !isServer) {
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        loader: 'esbuild-loader',
        options: { target: 'es2017' },
        exclude: /node_modules/
      });
    }
    
    // Windows-specific optimizations
    if (process.platform === 'win32') {
      // Increase filesystem watching limits on Windows
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after the first change
      };
      
      // Handle long path names on Windows
      config.resolve.symlinks = false;
    }
    
    return config;
  }
};

const withVanillaExtract = createVanillaExtractPlugin();
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(withVanillaExtract(nextConfig));
