/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/benchmark", destination: "/channel-dna", permanent: true },
      { source: "/benchmark/:path*", destination: "/channel-dna/:path*", permanent: true },
    ];
  },
};

module.exports = nextConfig;
