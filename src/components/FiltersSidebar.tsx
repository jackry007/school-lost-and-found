// src/components/FiltersSidebar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

/* ----- Brand tokens (match home) ----- */
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

const CATEGORY_OPTIONS = [
  "Clothing",
  "Electronics",
  "Accessories",
  "Bags",
  "Books",
  "Keys",
  "IDs / Cards",
  "Bottle",
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

  const [cats, setCats] = useState<string[]>(
    (initial.category ?? []).filter(Boolean)
  );

  const isActive = useMemo(() => {
    return (
      (initial.q && initial.q.length > 0) ||
      cats.length > 0 ||
      (initial.location && initial.location.length > 0) ||
      (initial.date_from && initial.date_from.length > 0) ||
      (initial.date_to && initial.date_to.length > 0) ||
      initial.sort === "oldest"
    );
  }, [initial, cats]);

  // Build a URL from the form data
  const buildUrlFromForm = useCallback((form: HTMLFormElement) => {
    const fd = new FormData(form);
    const params = new URLSearchParams();

    for (const [k, v] of fd.entries()) {
      if (!v) continue;
      if (k === "category") params.append("category", String(v));
      else params.set(k, String(v));
    }

    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  }, []);

  // Update instantly on change
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      const form = e.currentTarget;
      router.replace(buildUrlFromForm(form));
    },
    [router, buildUrlFromForm]
  );

  // Toggle category chip
  const toggleCat = (c: string) => {
    setCats((prev) => {
      const next = prev.includes(c)
        ? prev.filter((x) => x !== c)
        : [...prev, c];

      const form = formRef.current;
      if (form) {
        Array.from(
          form.querySelectorAll('input[type="hidden"][name="category"]')
        ).forEach((el) => el.remove());
        next.forEach((val) => {
          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = "category";
          hidden.value = val;
          form.appendChild(hidden);
        });
        form.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return next;
    });
  };

  const clearAll = () => {
    setCats([]);
    const form = formRef.current;
    if (form) {
      form.reset();
      Array.from(
        form.querySelectorAll('input[type="hidden"][name="category"]')
      ).forEach((el) => el.remove());
      router.replace("/search");
    }
  };

  /* ----- PaperGrid background ----- */
  const dot = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${CREEK_NAVY}22'/></svg>`
  );

  return (
    <aside className="w-full md:w-64 md:sticky md:top-16 self-start">
      <div
        className="rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,.05)] bg-white dark:bg-gray-900"
        style={{
          backgroundImage: `url("data:image/svg+xml,${dot}")`,
          backgroundColor: "#fafbff",
        }}
      >
        {/* Header with shield + Reset */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="22" height="26" viewBox="0 0 24 28" aria-hidden>
              <path
                d="M12 0l10 4v8c0 7-5 12-10 16C7 24 2 19 2 12V4l10-4z"
                fill={CREEK_RED}
              />
              <path
                d="M12 3l7 2v6c0 5-4 9-7 12-3-3-7-7-7-12V5l7-2z"
                fill="white"
                opacity=".95"
              />
              <path
                d="M12 4.5l5 1.5v5c0 4-3.2 7-5 8.8-1.8-1.8-5-4.8-5-8.8v-5l5-1.5z"
                fill={CREEK_NAVY}
              />
            </svg>
            <h2
              className="text-base font-semibold"
              style={{ color: CREEK_NAVY }}
            >
              Filters
            </h2>
          </div>
          {isActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium underline"
              style={{ color: CREEK_RED }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Form */}
        <form
          ref={formRef}
          action="/search"
          method="get"
          className="space-y-5"
          onChange={onChange}
        >
          {initial.q && (
            <input type="hidden" name="q" defaultValue={initial.q} />
          )}
          {cats.map((c) => (
            <input key={c} type="hidden" name="category" value={c} />
          ))}

          {/* Category chips */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <p
              className="mb-2 text-sm font-medium"
              style={{ color: CREEK_NAVY }}
            >
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const active = cats.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCat(c)}
                    className={`rounded-full px-3 py-1.5 text-sm transition shadow-sm ring-1 ${
                      active
                        ? "text-white"
                        : "bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                    style={{
                      backgroundColor: active ? CREEK_RED : undefined,
                      borderColor: active ? CREEK_RED : "rgba(0,0,0,0.08)",
                    }}
                    aria-pressed={active}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <label
              htmlFor="location"
              className="mb-1 block text-sm font-medium"
              style={{ color: CREEK_NAVY }}
            >
              Location
            </label>
            <div className="relative">
              <input
                id="location"
                name="location"
                placeholder="e.g., Gym, Library"
                defaultValue={initial.location ?? ""}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 
                           px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 
                           focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
            </div>
          </div>

          {/* Date range */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <p
              className="mb-2 text-sm font-medium"
              style={{ color: CREEK_NAVY }}
            >
              Date range
            </p>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <input
                  type="date"
                  name="date_from"
                  defaultValue={initial.date_from ?? ""}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 
                             px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 
                             focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="date"
                  name="date_to"
                  defaultValue={initial.date_to ?? ""}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 
                             px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 
                             focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
                />
              </div>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label
              htmlFor="sort"
              className="mb-1 block text-sm font-medium"
              style={{ color: CREEK_NAVY }}
            >
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={initial.sort ?? "newest"}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 
                         px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 
                         focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Apply / Reset buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              style={{ backgroundColor: CREEK_RED }}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ borderColor: "rgba(0,0,0,.1)", color: CREEK_NAVY }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
