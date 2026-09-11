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
      // Anti-embed: prevent iframing on any domain except our own
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
      // HTML entry point — always revalidate (short TTL, ETag check)
      {
        source: '/get-droned',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/get-droned/',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/get-droned/index.html',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      // Static assets (JS, CSS, images, audio) — 1 year immutable via ?v= query busting
      {
        source: '/get-droned/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      { source: '/get-droned/assets/js/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
    ]
  },
}

export default nextConfig
