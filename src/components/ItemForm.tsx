// src/components/ItemForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "item-photos";

/** Keep this in sync with your DB enum / filter sidebar */
export const CATEGORIES = [
  "Clothing",
  "Electronics",
  "Accessories",
  "Bags",
  "Books",
  "Keys",
  "IDs / Cards",
  "Bottle",
  "Misc",
] as const;
export type Category = (typeof CATEGORIES)[number];

/* ---- Brand tokens (match home) ---- */
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* ---- Upload policy ---- */
const MAX_MB = 5;
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/* ---- PaperGrid background (SSR-safe constants) ---- */
const DOT_BG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${CREEK_NAVY}22'/></svg>`
);
const PAPER_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${DOT_BG}")`,
  backgroundColor: "#fafbff",
};

export default function ItemForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Client-only default date to avoid hydration mismatch
  const [dateFound, setDateFound] = useState<string>("");
  useEffect(() => {
    setDateFound(new Date().toISOString().slice(0, 10));
  }, []);

  // Local preview URL w/ cleanup
  const [filePreview, setFilePreview] = useState<string | null>(null);
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get("title") || "").trim();
    const location_found = String(formData.get("location_found") || "").trim();
    const category = (String(formData.get("category") || "Misc").trim() ||
      "Misc") as Category;
    const date_found = String(formData.get("date_found") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const file = formData.get("photo") as File | null;

    if (!title) {
      setErr("Please enter a title.");
      setSubmitting(false);
      return;
    }
    if (!date_found) {
      setErr("Please select the date the item was found.");
      setSubmitting(false);
      return;
    }

    if (file && file.size > 0) {
      const fileMb = file.size / (1024 * 1024);
      if (fileMb > MAX_MB) {
        setErr(
          `Image is too large (${fileMb.toFixed(1)} MB). Max ${MAX_MB} MB.`
        );
        setSubmitting(false);
        return;
      }
      if (
        ALLOWED_MIME.length &&
        file.type &&
        !ALLOWED_MIME.includes(file.type)
      ) {
        setErr("Unsupported image type. Please upload JPG/PNG/WebP/HEIC.");
        setSubmitting(false);
        return;
      }
    }

    // 1) Upload photo (if provided)
    let photo_path: string | null = null;
    if (file && file.size > 0) {
      try {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `public/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadErr) throw uploadErr;
        photo_path = path;
      } catch (e: any) {
        setErr(`Photo upload failed: ${e?.message || e}`);
        setSubmitting(false);
        return;
      }
    }

    // 2) Insert DB row
    try {
      const { error: insertErr } = await supabase.from("items").insert([
        {
          title,
          location_found,
          category,
          date_found,
          status: "listed",
          photo_url: photo_path,
          notes,
        },
      ]);
      if (insertErr) throw insertErr;
    } catch (e: any) {
      setErr(`Could not save item: ${e?.message || e}`);
      setSubmitting(false);
      return;
    }

    // 3) Redirect
    router.push("/?posted=1");
  }

  return (
    <section className="mx-auto max-w-3xl">
      {/* Header with shield */}
      <div className="mb-5 flex items-center gap-2">
        <svg width="28" height="32" viewBox="0 0 24 28" aria-hidden>
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
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: CREEK_NAVY }}
        >
          Report a found item
        </h2>
      </div>

      <div
        className="rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,.05)] bg-white dark:bg-gray-900"
        style={PAPER_STYLE}
      >
        {err && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Title */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-medium"
                style={{ color: CREEK_NAVY }}
              >
                Title *
              </span>
              <input
                name="title"
                required
                placeholder="e.g., Black North Face Jacket"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm shadow-sm outline-none focus:ring-2
                           focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
              />
            </label>

            {/* Category */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-medium"
                style={{ color: CREEK_NAVY }}
              >
                Category
              </span>
              <select
                name="category"
                defaultValue="Misc"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm shadow-sm outline-none focus:ring-2
                           focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {/* Location */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-medium"
                style={{ color: CREEK_NAVY }}
              >
                Location found
              </span>
              <input
                name="location_found"
                placeholder="e.g., Library 2F"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm shadow-sm outline-none focus:ring-2
                           focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
              />
            </label>

            {/* Date (controlled after mount) */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-medium"
                style={{ color: CREEK_NAVY }}
              >
                Date found *
              </span>
              <input
                type="date"
                name="date_found"
                required
                value={dateFound}
                onChange={(e) => setDateFound(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm shadow-sm outline-none focus:ring-2
                           focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
              />
            </label>
          </div>

          {/* Notes */}
          <label className="block">
            <span
              className="mb-1 block text-sm font-medium"
              style={{ color: CREEK_NAVY }}
            >
              Notes (optional)
            </span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any identifying details, where exactly you left it, etc."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                         px-3 py-2 text-sm shadow-sm outline-none focus:ring-2
                         focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
            />
          </label>

          {/* Photo + preview */}
          <div className="grid gap-4 md:grid-cols-[1fr,200px] md:items-start">
            <label className="block">
              <span
                className="mb-1 block text-sm font-medium"
                style={{ color: CREEK_NAVY }}
              >
                Photo (optional)
              </span>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                           px-3 py-2 text-sm shadow-sm outline-none file:mr-3 file:rounded-md file:border-0
                           file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium
                           hover:file:bg-gray-200 dark:file:bg-gray-800 dark:hover:file:bg-gray-700
                           focus:ring-2 focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (filePreview) URL.revokeObjectURL(filePreview);
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setFilePreview(url);
                  } else {
                    setFilePreview(null);
                  }
                }}
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                JPG/PNG/WebP/HEIC, up to {MAX_MB}MB.
              </p>
            </label>

            {filePreview && (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreview}
                  alt="Preview"
                  className="block h-40 w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition
                         hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: CREEK_RED }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={() => history.back()}
              disabled={submitting}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800
                         disabled:opacity-60"
              style={{ borderColor: "rgba(0,0,0,.1)", color: CREEK_NAVY }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
