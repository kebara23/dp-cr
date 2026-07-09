/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@diego-porras/database",
    "@diego-porras/shared",
    "@diego-porras/ctk",
    "@diego-porras/engine",
    "@diego-porras/agent",
  ],
  experimental: {},
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

module.exports = nextConfig;
