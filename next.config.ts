import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Cache game assets long-term; HTML always revalidated so updates reach players
  async headers() {
    return [
      // HTML entry point — always revalidate (short TTL, ETag check)
      {
        source: '/get-droned',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate' }],
      },
      {
        source: '/get-droned/',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate' }],
      },
      {
        source: '/get-droned/index.html',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate' }],
      },
      // Static assets (JS, CSS, images, audio) — 1 year immutable via ?v= query busting
      {
        source: '/get-droned/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
