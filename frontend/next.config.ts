import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    domains: ["localhost", "127.0.0.1"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
