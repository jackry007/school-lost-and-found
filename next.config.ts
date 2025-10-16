// next.config.ts
import type { NextConfig } from "next";

const isGh = process.env.GH_PAGES === "true";
const repo = "school-lost-and-found";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    unoptimized: true, // required for static export
  },

  output: "export",

  ...(isGh ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),

  // 👇 expose to the client so we can prefix manual paths
  env: { NEXT_PUBLIC_BASE_PATH: isGh ? `/${repo}` : "" },
};

export default nextConfig;
