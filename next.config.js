/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  async rewrites() {
    return [
      // channelreport.net → /channelreport/* 내부 라우트로 매핑
      {
        source: "/",
        has: [{ type: "host", value: "channelreport.net" }],
        destination: "/channelreport",
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "channelreport.net" }],
        destination: "/channelreport/:path*",
      },
      {
        source: "/",
        has: [{ type: "host", value: "www.channelreport.net" }],
        destination: "/channelreport",
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.channelreport.net" }],
        destination: "/channelreport/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
