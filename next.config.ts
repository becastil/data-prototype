import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';
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
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Use esbuild-loader for faster client prod builds
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        loader: 'esbuild-loader',
        options: { target: 'es2017' },
        exclude: /node_modules/
      });
    }
    return config;
  }
};

const withVanillaExtract = createVanillaExtractPlugin();
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(withVanillaExtract(nextConfig));
