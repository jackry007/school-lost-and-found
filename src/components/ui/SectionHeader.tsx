// src/components/ui/SectionHeader.tsx
"use client";

type SectionHeaderProps = {
  title: string;
  kicker?: string;
  creekRed?: string;
  creekNavy?: string;
};

export function SectionHeader({
  title,
  kicker,
  creekRed = "#BF1E2E",
  creekNavy = "#0B2C5C",
}: SectionHeaderProps) {
  return (
    <div className="mb-5">
      {kicker && (
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: creekNavy }}
        >
          {kicker}
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        {/* Creek shield icon */}
        <svg width="28" height="32" viewBox="0 0 24 28" aria-hidden>
          <path
            d="M12 0l10 4v8c0 7-5 12-10 16C7 24 2 19 2 12V4l10-4z"
            fill={creekRed}
          />
          <path
            d="M12 3l7 2v6c0 5-4 9-7 12-3-3-7-7-7-12V5l7-2z"
            fill="white"
            opacity=".95"
          />
          <path
            d="M12 4.5l5 1.5v5c0 4-3.2 7-5 8.8-1.8-1.8-5-4.8-5-8.8v-5l5-1.5z"
            fill={creekNavy}
          />
        </svg>

        <h2
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: creekNavy }}
        >
          {title}
        </h2>
      </div>

      {/* gradient divider */}
      <div
        className="mt-2 h-1 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${creekRed}, ${creekNavy})`,
        }}
      />
    </div>
  );
}
