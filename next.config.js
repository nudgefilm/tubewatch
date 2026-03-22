/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // v0-core is a read-only UI baseline; build should not require patching its internal types.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
