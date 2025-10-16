"use client";

import { useEffect, useState } from "react";

// Optional: flip this with a public env (must start with NEXT_PUBLIC_)
const shouldUseCursorLand =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_CURSOR_LAND === "1";

export default function MainShell({ children }: { children: React.ReactNode }) {
  // Render stable baseline on SSR; add dynamic class after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Only add the extra class after the client mounts (no SSR mismatch).
  const extra = mounted && shouldUseCursorLand ? " default_cursor_land" : "";

  return <main className={`py-8${extra}`}>{children}</main>;
}
