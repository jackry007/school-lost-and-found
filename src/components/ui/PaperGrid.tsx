// src/components/ui/PaperGrid.tsx
"use client";

type PaperGridProps = {
  children: React.ReactNode;
  creekNavy?: string;
};

export function PaperGrid({ children, creekNavy = "#0B2C5C" }: PaperGridProps) {
  const dot = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'>
      <circle cx='1' cy='1' r='1' fill='${creekNavy}22'/>
    </svg>`,
  );

  return (
    <div
      className="rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,.05)]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${dot}")`,
        backgroundColor: "#fafbff",
      }}
    >
      {children}
    </div>
  );
}
