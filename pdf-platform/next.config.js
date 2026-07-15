/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  webpack: (config) => {
    // pdf.js needs this to avoid bundling its worker incorrectly
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
