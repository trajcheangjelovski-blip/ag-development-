const createNextIntlPlugin = require('next-intl/plugin')

// Points next-intl at the request config that loads the per-locale messages.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker/self-hosted deployment
  output: 'standalone',

  // Don't run ESLint during the production build. Linting is a dev-time concern;
  // skipping it keeps `next build` from failing on tooling/peer-dependency issues.
  eslint: { ignoreDuringBuilds: true },

  // Pin the workspace root so Next stops picking the stray lockfile in your home folder
  turbopack: {
    root: __dirname,
  },

  // Allow dev access over the local network IP (optional)
  allowedDevOrigins: ['192.168.1.43'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Force HTTPS for 2 years (only takes effect over HTTPS)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Block clickjacking — the app can't be framed by other sites
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Stop MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak full URLs to other origins
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Lock down powerful browser features by default
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
