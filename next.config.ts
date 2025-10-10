// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ← let the prod build run even if ESLint finds issues
  },
};

export default nextConfig;
