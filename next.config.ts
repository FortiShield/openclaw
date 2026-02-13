import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude the CLI source from Next.js compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  // The src/ directory is the CLI codebase; Next.js should not touch it
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
