import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5000mb",
    },
  },
};

export default nextConfig;
