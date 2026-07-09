import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dp/database", "@dp/shared", "@dp/engine", "@dp/agent", "@dp/ctk"],
};

export default config;
