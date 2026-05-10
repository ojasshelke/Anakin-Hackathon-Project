import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PERF FIX: Disabled source maps in production to prevent shipping MBs of maps
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  transpilePackages: [],

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // PERF FIX: Added bundle optimization for heavy imports
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', '@heroicons/react', 'recharts'],
  },

  images: {
    remotePatterns: imageHosts,
    // PERF FIX: Increased minimumCacheTTL from 60 to 3600 to prevent constant re-validation
    minimumCacheTTL: 3600,
    // PERF FIX: Added formats for better compression
    formats: ['image/avif', 'image/webp'],
  },

  // PERF FIX: Added HTTP caching headers for static assets
  async headers() {
    return [
      {
        source: '/public/models/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/assets/images/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};
export default nextConfig;
