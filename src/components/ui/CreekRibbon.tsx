// src/components/ui/CreekRibbon.tsx
"use client";

type CreekRibbonProps = {
  creekRed?: string;
  creekNavy?: string;
};

export function CreekRibbon({
  creekRed = "#BF1E2E",
  creekNavy = "#0B2C5C",
}: CreekRibbonProps) {
  return (
    <div
      className="h-8 w-full -mt-1 shadow-[inset_0_-1px_0_rgba(0,0,0,.08)]"
      style={{
        background: `repeating-linear-gradient(
          135deg,
          ${creekRed} 0 16px,
          ${creekNavy} 16px 32px
        )`,
      }}
    />
  );
}
