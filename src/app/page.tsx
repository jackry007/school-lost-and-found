// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ItemCard } from "@/components/ItemCard";
import { supabase } from "@/lib/supabaseClient";

type CardItem = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  thumb: string;
};

const BUCKET = "item-photos";
const FALLBACK_THUMB = "/no-image.png";

// 👉 Edit these to match your categories / DB enum
const CATEGORY_OPTIONS = [
  "All",
  "Clothing",
  "Electronics",
  "Accessories",
  "Bags",
  "Books",
  "Keys",
  "IDs / Cards",
  "Misc",
];

export default function HomePage() {
  const [items, setItems] = useState<CardItem[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .schema("public")
        .from("items")
        .select(
          "id, title, location_found, category, date_found, photo_url, status"
        )
        .order("date_found", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false })
        .limit(12);

      if (error) {
        setErrMsg(error.message);
        return;
      }

      const mapped: CardItem[] = (data ?? []).map((row: any) => {
        let thumb = FALLBACK_THUMB;
        const path: string | null = row.photo_url ?? null;
        if (path) {
          if (/^https?:\/\//i.test(path)) {
            thumb = path;
          } else {
            const { data: urlData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(path);
            thumb = urlData?.publicUrl || FALLBACK_THUMB;
          }
        }

        return {
          id: String(row.id),
          title: String(row.title ?? "Untitled"),
          location: String(row.location_found ?? "—"),
          category: String(row.category ?? "Misc"),
          date: new Date(row.date_found).toISOString().slice(0, 10),
          thumb,
        };
      });

      setItems(mapped);
      setErrMsg(null);
    })();
  }, []);

  const hasItems = items.length > 0;

  return (
    <>
      {/* Hero + search */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Find your stuff fast
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Search recent found items or submit a quick report when you find
              something.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/report" className="btn">
                Report Found Item
              </Link>
              <Link href="/search" className="btn btn-outline">
                Browse Items
              </Link>
            </div>
          </div>

          {/* 🔽 Search + Category filter */}
          <form action="/search" className="w-full md:w-[520px]">
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Category dropdown */}
              <div className="sm:w-48">
                <label htmlFor="category" className="sr-only">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  {/* empty value = All */}
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c === "All" ? "" : c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keyword input */}
              <div className="flex-1">
                <label htmlFor="q" className="sr-only">
                  Search items
                </label>
                <input
                  id="q"
                  name="q"
                  placeholder="Search by name, color, location..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {errMsg && (
        <div className="mb-4 rounded-lg border border-red-600/40 bg-red-900/10 p-3 text-sm text-red-400">
          Supabase error: {errMsg}
        </div>
      )}

      {hasItems ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Recently reported</h2>
            <Link href="/search" className="text-sm underline">
              View all
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.id}>
                <ItemCard item={it} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="grid place-items-center rounded-2xl border border-dashed border-gray-300 py-20 dark:border-gray-700">
          <div className="text-center">
            <p className="text-lg font-medium">No items yet</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Be the first to add a found item so we can get it back to its
              owner.
            </p>
            <Link href="/report" className="btn mt-4">
              Report an Item
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
