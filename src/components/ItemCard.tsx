"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

/* ─────────────────────────────
   Type
   ───────────────────────────── */
export type Item = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string; // ISO yyyy-mm-dd
  thumb?: string | null;
  note?: string | null;
};

/* ─────────────────────────────
   ItemCard Component
   ───────────────────────────── */
export function ItemCard({ item }: { item: Item }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (open && closeRef.current) closeRef.current.focus();
  }, [open]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ──────────────── Card (Grid Item)
  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 cursor-pointer"
        aria-label={`View details for ${item.title}`}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
          {item.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumb}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="line-clamp-1 font-medium leading-tight text-gray-900 dark:text-gray-100">
            {item.title}
          </h3>
          <p className="line-clamp-1 text-sm text-gray-600 dark:text-gray-400">
            {item.location} • {item.category}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Found {new Date(item.date).toLocaleDateString()}
          </p>
        </div>
      </article>

      {/* ──────────────── Modal (Quick View) */}
      {mounted &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${item.title} details`}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Dialog */}
            <div className="relative z-10 grid w-[min(92vw,1000px)] h-[min(90vh,900px)] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-950 md:grid-cols-2">
              {/* Left: Image (contained, never overflows) */}
              <div className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                {item.thumb ? (
                  <img
                    src={item.thumb}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-500">
                    No image
                  </div>
                )}

                {/* Close */}
                <button
                  ref={closeRef}
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Right: Info (scrollable) */}
              <div className="flex min-h-0 flex-col overflow-auto">
                <div className="p-5 md:p-6">
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.location} • {item.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    Found {new Date(item.date).toLocaleDateString()}
                  </p>

                  <div className="prose mt-4 max-w-none prose-p:my-3 dark:prose-invert">
                    <h3 className="mb-1 text-base font-medium">Description</h3>
                    <p className="text-sm leading-6">
                      {item.note?.trim() || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Sticky action bar — claim button always visible */}
                <div className="sticky bottom-0 z-10 border-t bg-white/85 p-4 backdrop-blur dark:bg-gray-950/85">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`/claim?item=${item.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Start claim
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
