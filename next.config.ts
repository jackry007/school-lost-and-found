// next.config.ts
import type { NextConfig } from "next";

const isGh = process.env.GH_PAGES === "true";       // set only for GH Pages builds
const repo = "school-lost-and-found";               // <-- your repo name

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    unoptimized: true, // required for static export
  },

  output: "export",

  // Only apply basePath/assetPrefix for GH builds
  ...(isGh ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default nextConfig;
