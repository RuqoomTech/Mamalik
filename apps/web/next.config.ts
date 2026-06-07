import type { NextConfig } from "next";
import path from "node:path";

const repositoryRoot = path.join(process.cwd(), "../..");

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: repositoryRoot,
  },
};

export default nextConfig;
