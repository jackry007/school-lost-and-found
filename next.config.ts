// next.config.ts
import type { NextConfig } from "next";

const isGh = process.env.GH_PAGES === "true";
const repo = "school-lost-and-found";
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
    unoptimized: true,
  },
  output: "export",
  trailingSlash: true,
  ...(isGh ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: isGh ? `/${repo}` : "" },
};

export default nextConfig;
