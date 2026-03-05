// src/components/ItemForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CreekDatePicker from "@/components/ui/CreekDatePicker";

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

/* ---- CCHS Brand tokens ----
   Royal Blue + Scarlet + White
*/
const CREEK_RED = "#BF1E2E"; // Scarlet
const CREEK_NAVY = "#0B2C5C"; // Royal Blue (your chosen token)

/* ---- Upload policy ---- */
const MAX_MB = 5;
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/* ---- PaperGrid background ---- */
const DOT_BG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${CREEK_NAVY}22'/></svg>`,
);
const PAPER_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${DOT_BG}")`,
  backgroundColor: "#ffffff",
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
  const [fileName, setFileName] = useState<string>("No photo selected");

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
    const location = String(formData.get("location") || "").trim();
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
          `Image is too large (${fileMb.toFixed(1)} MB). Max ${MAX_MB} MB.`,
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

    // 2) Insert DB row (UNCHANGED)
    try {
      const { error: insertErr } = await supabase.from("items").insert([
        {
          title,
          location,
          category,
          date_found,
          status: "pending",
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
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          {/* Shield */}
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl border bg-white shadow-sm"
            style={{ borderColor: "rgba(11,44,92,0.18)" }}
            aria-hidden="true"
          >
            <svg width="26" height="30" viewBox="0 0 24 28">
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
          </div>

          <div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: CREEK_NAVY }}
            >
              Report a found item
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Log an item found on campus so the owner can identify it and pick
              it up at the Main Office.
            </p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        className="relative overflow-hidden rounded-3xl border bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,.06)]"
        style={{ borderColor: "rgba(11,44,92,0.15)", ...PAPER_STYLE }}
      >
        {/* CCHS header stripe */}
        <div
          className="absolute left-0 top-0 h-2 w-full"
          style={{ background: CREEK_NAVY }}
        />
        <div
          className="absolute left-0 top-2 h-1 w-full"
          style={{ background: CREEK_RED }}
        />

        <p className="mb-4 text-xs text-gray-500">
          Fields marked{" "}
          <span className="font-semibold" style={{ color: CREEK_RED }}>
            *
          </span>{" "}
          are required.
        </p>

        {err && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Title */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-semibold"
                style={{ color: CREEK_NAVY }}
              >
                Title <span style={{ color: CREEK_RED }}>*</span>
              </span>
              <input
                name="title"
                required
                placeholder="e.g., Black North Face Jacket"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none
                           focus:ring-2 focus:ring-[rgba(11,44,92,0.55)]"
                style={{ borderColor: "rgba(11,44,92,0.18)" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Brand + color + item type works best
              </p>
            </label>

            {/* Category */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-semibold"
                style={{ color: CREEK_NAVY }}
              >
                Category
              </span>
              <select
                name="category"
                defaultValue="Misc"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none
                           focus:ring-2 focus:ring-[rgba(11,44,92,0.55)]"
                style={{ borderColor: "rgba(11,44,92,0.18)" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the closest match
              </p>
            </label>

            {/* Location */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-semibold"
                style={{ color: CREEK_NAVY }}
              >
                Location found
              </span>
              <input
                name="location"
                placeholder="e.g., Library 2F near printers"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none
                           focus:ring-2 focus:ring-[rgba(11,44,92,0.55)]"
                style={{ borderColor: "rgba(11,44,92,0.18)" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Be specific if you can — it helps staff confirm details.
              </p>
            </label>

            {/* Date (custom calendar) */}
            <label className="block">
              <span
                className="mb-1 block text-sm font-semibold"
                style={{ color: CREEK_NAVY }}
              >
                Date found <span style={{ color: CREEK_RED }}>*</span>
              </span>

              <CreekDatePicker
                value={dateFound}
                onChange={setDateFound}
                creekRed={CREEK_RED}
                creekNavy={"#0B2C5C"}
                required
              />

              {/* keeps FormData + Supabase insert working */}
              <input type="hidden" name="date_found" value={dateFound} />

              <p className="mt-1 text-xs text-gray-500">
                Pick the day the item was turned in to the office.
              </p>
            </label>
          </div>

          {/* Notes */}
          <label className="block">
            <span
              className="mb-1 block text-sm font-semibold"
              style={{ color: CREEK_NAVY }}
            >
              Notes (optional)
            </span>
            <textarea
              name="notes"
              rows={4}
              placeholder="Identifying details (stickers, initials, case color), or exactly where it was found."
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none
                         focus:ring-2 focus:ring-[rgba(11,44,92,0.55)]"
              style={{ borderColor: "rgba(11,44,92,0.18)" }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Avoid personal info like phone numbers — staff can verify identity
              at pickup.
            </p>
          </label>

          {/* Photo + preview */}
          <div className="grid gap-4 md:grid-cols-[1fr,220px] md:items-start">
            <div className="block">
              <span
                className="mb-1 block text-sm font-semibold"
                style={{ color: CREEK_NAVY }}
              >
                Photo (optional)
              </span>

              <div
                className="rounded-2xl border border-dashed bg-white p-4"
                style={{ borderColor: "rgba(11,44,92,0.22)" }}
              >
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="w-full text-sm outline-none
                             file:mr-3 file:rounded-md file:border-0
                             file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold
                             hover:file:bg-gray-200"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (filePreview) URL.revokeObjectURL(filePreview);

                    if (f) {
                      setFileName(f.name);
                      setFilePreview(URL.createObjectURL(f));
                    } else {
                      setFileName("No photo selected");
                      setFilePreview(null);
                    }
                  }}
                />

                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold">{fileName}</span>
                  <span className="block text-gray-500">
                    Upload a clear photo to help the owner identify it.
                    JPG/PNG/WebP/HEIC, up to {MAX_MB}MB.
                  </span>
                </p>
              </div>
            </div>

            {filePreview ? (
              <div
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: "rgba(11,44,92,0.15)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreview}
                  alt="Preview"
                  className="block h-44 w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="grid h-44 place-items-center rounded-2xl border border-dashed bg-white text-center text-xs text-gray-500"
                style={{ borderColor: "rgba(11,44,92,0.18)" }}
              >
                <div>
                  <div className="text-lg">📷</div>
                  <div className="mt-1">Preview appears here</div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="sticky bottom-4 rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur"
            style={{ borderColor: "rgba(11,44,92,0.15)" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-600">
                Submitting marks the item as{" "}
                <span className="font-semibold">pending</span> for staff review.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition
                             hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: CREEK_RED }}
                >
                  {submitting ? "Submitting..." : "Submit found item"}
                </button>

                <button
                  type="button"
                  onClick={() => history.back()}
                  disabled={submitting}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition
                             hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "rgba(11,44,92,0.25)",
                    color: CREEK_NAVY,
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
