/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this line
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'subdomain',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  reactStrictMode: false,
};

module.exports = nextConfig;