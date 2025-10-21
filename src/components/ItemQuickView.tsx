// src/components/ItemQuickView.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLockBodyScroll } from "./useLockBodyScroll";
import type { Item } from "@/lib/types";

type Props = { item: Item | null; onClose: () => void };

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function ItemQuickView({ item, onClose }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  useLockBodyScroll(Boolean(item));
  React.useEffect(() => setMounted(true), []);

  // ESC to close
  React.useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  // Focus close on open
  React.useEffect(() => {
    if (item && closeBtnRef.current) closeBtnRef.current.focus();
  }, [item]);

  if (!mounted || !item) return null;

  const imgUrl = item.photo_url ?? "/placeholder.svg";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} details`}
      className="fixed inset-0 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop click
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="
          absolute inset-0 mx-auto my-auto
          grid w-[min(1000px,92vw)] h-[min(90vh,900px)]
          overflow-hidden rounded-2xl bg-white shadow-xl
          dark:bg-neutral-950 md:grid-cols-2
        "
      >
        {/* IMAGE SIDE: contained/centered, never overflows */}
        <div className="relative flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <img
            src={imgUrl}
            alt={item.title}
            className="max-h-full max-w-full object-contain transition-transform duration-300"
          />

          {/* Close */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white outline-none transition hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENT SIDE: scrollable with sticky action bar */}
        <div className="flex min-h-0 flex-col overflow-auto">
          <div className="p-5 md:p-6">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              {item.title}
            </h2>

            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {item.location_found ?? "Unknown location"} •{" "}
              {item.category ?? "Uncategorized"}
            </p>

            <p className="text-xs text-neutral-500">
              Found {formatDate(item.date_found)} •{" "}
              {item.status === "claimed" ? "Claimed" : "Listed"}
            </p>

            <div className="prose mt-4 max-w-none prose-p:my-3 dark:prose-invert">
              <h3 className="mb-1 text-base font-medium">Description</h3>
              <p className="text-sm leading-6">
                {item.description?.trim() ||
                  "No additional description was provided."}
              </p>
            </div>
          </div>

          {/* Sticky actions */}
          <div className="sticky bottom-0 z-10 border-t bg-white/85 p-4 backdrop-blur dark:bg-neutral-950/85">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/items/${item.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                View full page
              </a>

              {item.status === "listed" && (
                <a
                  href={`/claim?item=${item.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Start claim
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
