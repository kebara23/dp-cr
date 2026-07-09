/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/*": ["../../node_modules/.pnpm/@prisma+client*/**/*"],
    "/api/**/*": ["../../node_modules/.pnpm/@prisma+client*/**/*"],
  },
  transpilePackages: [
    "@diego-porras/database",
    "@diego-porras/shared",
    "@diego-porras/ctk",
    "@diego-porras/engine",
    "@diego-porras/agent",
  ],
  experimental: {},
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pdf-parse"],
};

module.exports = nextConfig;
