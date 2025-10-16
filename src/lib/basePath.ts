export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const withBase = (p: string) =>
  `${BASE}${p.startsWith("/") ? p : `/${p}`}`;