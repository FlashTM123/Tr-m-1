// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",        // Domain ảnh Uploadthing
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",       // Domain mới của Uploadthing
      },
    ],
  },
};

export default nextConfig;
