// src/components/FiltersSidebar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";

const CATEGORY_OPTIONS = [
  "Clothing",
  "Electronics",
  "Accessories",
  "Bags",
  "Books",
  "Keys",
  "IDs / Cards",
  "Misc",
];

export type FiltersInitial = {
  q?: string;
  category?: string[]; // multi
  location?: string;
  date_from?: string;
  date_to?: string;
  sort?: "newest" | "oldest";
};

type Props = { initial: FiltersInitial };

export function FiltersSidebar({ initial }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  // Build a URL from the form data (supports multi-value fields like `category`)
  const buildUrlFromForm = useCallback((form: HTMLFormElement) => {
    const fd = new FormData(form);
    const params = new URLSearchParams();

    // Preserve multiple categories
    for (const [k, v] of fd.entries()) {
      if (!v) continue;
      if (k === "category") {
        params.append("category", String(v));
      } else {
        params.set(k, String(v));
      }
    }

    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  }, []);

  // Instant update on any change (keeps "Apply" for no-JS fallback)
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      const form = e.currentTarget;
      router.replace(buildUrlFromForm(form));
    },
    [router, buildUrlFromForm]
  );

  const isActive = useMemo(() => {
    return (
      (initial.q && initial.q.length > 0) ||
      (initial.category && initial.category.length > 0) ||
      (initial.location && initial.location.length > 0) ||
      (initial.date_from && initial.date_from.length > 0) ||
      (initial.date_to && initial.date_to.length > 0) ||
      initial.sort === "oldest"
    );
  }, [initial]);

  return (
    <aside className="w-full md:w-64 md:sticky md:top-16 self-start">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Filters</h2>
          {isActive && (
            <a
              href="/search"
              className="text-sm text-blue-600 hover:underline"
              aria-label="Reset all filters"
            >
              Reset
            </a>
          )}
        </div>

        <form
          ref={formRef}
          action="/search"
          method="get"
          className="space-y-5"
          onChange={onChange}
        >
          {/* keep keyword (if present) */}
          {initial.q && (
            <input type="hidden" name="q" defaultValue={initial.q} />
          )}

          {/* Category */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <p className="text-sm font-medium mb-2">Category</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {CATEGORY_OPTIONS.map((c) => {
                const checked = (initial.category ?? []).includes(c);
                return (
                  <label key={c} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="category"
                      value={c}
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                    />
                    <span>{c}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <label
              htmlFor="location"
              className="text-sm font-medium mb-1 block"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              placeholder="e.g., Gym, Library"
              defaultValue={initial.location ?? ""}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date range */}
          {/* Date range */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <p className="text-sm font-medium mb-2">Date range</p>

            {/* Make children shrink instead of overflowing */}
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  name="date_from"
                  defaultValue={initial.date_from ?? ""}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  name="date_to"
                  defaultValue={initial.date_to ?? ""}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="text-sm font-medium mb-1 block">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={initial.sort ?? "newest"}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* No-JS fallback buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
            >
              Apply
            </button>
            <a
              href="/search"
              className="rounded-lg border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Reset
            </a>
          </div>
        </form>
      </div>
    </aside>
  );
}
