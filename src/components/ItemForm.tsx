// src/components/ItemForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "item-photos";

// Optional: adjust to your categories
const CATEGORIES = [
  "Clothing",
  "Electronics",
  "Bottle",
  "Books",
  "Keys",
  "Backpack",
  "Other",
];

export default function ItemForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get("title") || "").trim();
    const location_found = String(formData.get("location_found") || "").trim();
    const category = String(formData.get("category") || "Other");
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

    // 1) Upload photo (if provided)
    let photo_path: string | null = null;
    if (file && file.size > 0) {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        // If you have auth, you could use the user's id in the path. Using "public" prefix for anon-friendly policy.
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
        photo_path = path; // store the *path* (your homepage code already handles path→publicURL)
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
          date_found, // should be date or timestamp column in Supabase
          status: "listed", // or "pending" if you want admin approval first
          photo_url: photo_path, // store the storage path (homepage code resolves it)
          notes,
        },
      ]);

      if (insertErr) throw insertErr;
    } catch (e: any) {
      setErr(`Could not save item: ${e?.message || e}`);
      setSubmitting(false);
      return;
    }

    // 3) Redirect (and optionally show a toast on home via a query param)
    router.push("/?posted=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && (
        <div className="rounded-lg border border-red-600/40 bg-red-900/10 p-3 text-sm text-red-400">
          {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title *</span>
          <input
            name="title"
            required
            placeholder="e.g., Black North Face Jacket"
            className="input w-full"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Category</span>
          <select name="category" className="input w-full">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Location found</span>
          <input
            name="location_found"
            placeholder="e.g., Library 2F"
            className="input w-full"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Date found *</span>
          <input
            type="date"
            name="date_found"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input w-full"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Notes (optional)</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="Any identifying details, where exactly you left it, etc."
          className="input w-full"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-[1fr,200px] md:items-start">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Photo (optional)
          </span>
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="input w-full"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) {
                const url = URL.createObjectURL(f);
                setFilePreview(url);
              } else {
                setFilePreview(null);
              }
            }}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            JPG/PNG, ideally under 2MB.
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

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => history.back()}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
