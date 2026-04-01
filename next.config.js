/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/benchmark", destination: "/channel-dna", permanent: true },
      { source: "/benchmark/:path*", destination: "/channel-dna/:path*", permanent: true },
      { source: "/seo-lab", destination: "/analysis", permanent: true },
      { source: "/seo-lab/:path*", destination: "/analysis", permanent: true },
    ];
  },
};

module.exports = nextConfig;
