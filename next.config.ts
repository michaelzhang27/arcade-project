import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.arcade.ai",
        port: "",
        pathname: "/_next/static/media/**",
      },
    ],
  },
};

export default nextConfig;
