/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker/self-hosted deployment
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
