/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker/self-hosted deployment
  output: 'standalone',

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
}

module.exports = nextConfig
