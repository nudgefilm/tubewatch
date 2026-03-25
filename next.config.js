/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.ggpht.com", pathname: "/**" },
      { protocol: "https", hostname: "yt3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/benchmark", destination: "/channel-dna", permanent: true },
      { source: "/benchmark/:path*", destination: "/channel-dna/:path*", permanent: true },
    ];
  },
};

module.exports = nextConfig;
