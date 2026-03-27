/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/trust',
        destination: '/trust/',
        permanent: true,
      },
      {
        source: '/anxiety',
        destination: '/anxiety/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
