import * as React from "react";

export type ItemCardData = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  thumb?: string | null;
  description?: string | null;
};

// Cherry Creek branding colors
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

// Base path for GH Pages ("" in dev, "/school-lost-and-found" in prod)
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ItemCard({ item }: { item: ItemCardData }) {
  const itemHref = `${BASE}/item/?id=${encodeURIComponent(item.id)}`;
  const claimHref = `${BASE}/claim?item=${encodeURIComponent(item.id)}`;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950"
      aria-label={`View details for ${item.title}`}
    >
      {/* Thumbnail */}
      <a
        href={itemHref}
        className="relative block aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
      >
        {item.thumb ? (
          <img
            src={item.thumb}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}

        {/* Overlay accent line */}
        <div
          className="absolute inset-x-0 bottom-0 h-1 opacity-80"
          style={{
            background: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
          }}
        />
      </a>

      {/* Card content */}
      <div className="flex flex-col gap-2 p-4">
        <a
          href={itemHref}
          className="line-clamp-1 font-semibold leading-tight text-gray-900 hover:text-[var(--creek-red)] dark:text-gray-100"
          style={{ "--creek-red": CREEK_RED } as React.CSSProperties}
        >
          {item.title}
        </a>

        <p className="line-clamp-1 text-sm text-gray-600 dark:text-gray-400">
          {item.location} • {item.category}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-500">
          Found {new Date(item.date).toLocaleDateString()}
        </p>

        {/* CTAs */}
        <div className="mt-2 flex gap-2">
          <a
            href={claimHref}
            className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: CREEK_RED }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor =
                "#A81828")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor =
                CREEK_RED)
            }
          >
            Start claim
          </a>
          <a
            href={itemHref}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-[var(--creek-navy)] transition-colors hover:bg-[var(--creek-navy)] hover:text-white dark:border-gray-700"
            style={{ "--creek-navy": CREEK_NAVY } as React.CSSProperties}
          >
            Details
          </a>
        </div>
      </div>
    </article>
  );
}
