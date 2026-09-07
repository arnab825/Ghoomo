/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Vercel-optimized standalone output
  output: 'standalone',

  // Image optimization via Vercel
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Security headers (supplemented by vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },

  // Suppress build warnings for known packages
  serverExternalPackages: [],

  // Optimize bundle
  experimental: {
    optimizePackageImports: ['lucide-react', 'zustand', 'zod'],
  },
};

module.exports = nextConfig;
