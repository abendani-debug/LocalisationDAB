import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/concept',
  output: 'standalone',
  images: { unoptimized: true },
};

export default nextConfig;
