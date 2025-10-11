// app/search/search-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ItemCard } from "@/components/ItemCard";
import {
  FiltersSidebar,
  type FiltersInitial,
} from "@/components/FiltersSidebar";

type Row = {
  id: string | number;
  title: string | null;
  location_found: string | null;
  category: string | null;
  date_found: string | null;
  photo_url: string | null;
  status: string | null;
};

export default function SearchClient() {
  const sp = useSearchParams();

  const q = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);
  const location = useMemo(() => (sp.get("location") ?? "").trim(), [sp]);
  const date_from = useMemo(() => (sp.get("date_from") ?? "").trim(), [sp]);
  const date_to = useMemo(() => (sp.get("date_to") ?? "").trim(), [sp]);
  const sort: "newest" | "oldest" =
    sp.get("sort") === "oldest" ? "oldest" : "newest";

  const categories = useMemo(() => {
    const all = sp.getAll("category").filter(Boolean);
    if (all.length === 0) {
      const single = sp.get("category");
      if (single?.includes(","))
        return single
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (single) return [single];
    }
    return all;
  }, [sp]);

  const [items, setItems] = useState<
    {
      id: string;
      title: string;
      location: string;
      category: string;
      date: string;
      thumb: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      let query = supabase
        .schema("public")
        .from("items")
        .select("id,title,location_found,category,date_found,photo_url,status")
        .eq("status", "listed");

      if (q) {
        query = query.or(
          `title.ilike.%${q}%,location_found.ilike.%${q}%,category.ilike.%${q}%`
        );
      }
      if (categories.length) query = query.in("category", categories);
      if (location) query = query.ilike("location_found", `%${location}%`);
      if (date_from) query = query.gte("date_found", date_from);
      if (date_to) query = query.lte("date_found", date_to);

      query = query.order("date_found", {
        ascending: sort === "oldest",
        nullsFirst: false,
      });

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      const BUCKET = "item-photos";
      const FALLBACK = "/no-image.png";

      const mapped =
        (data ?? []).map((row: Row) => {
          let thumb = FALLBACK;
          const path = row.photo_url ?? null;

          if (path) {
            if (/^https?:\/\//i.test(path)) {
              thumb = path;
            } else {
              const { data: urlData } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(path);
              thumb = urlData?.publicUrl || FALLBACK;
            }
          }

          return {
            id: String(row.id),
            title: String(row.title ?? "Untitled"),
            location: String(row.location_found ?? "—"),
            category: String(row.category ?? "Misc"),
            date: row.date_found
              ? new Date(row.date_found).toISOString().slice(0, 10)
              : "",
            thumb,
          };
        }) ?? [];

      setItems(mapped);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [q, categories, location, date_from, date_to, sort]);

  const initialFilters: FiltersInitial = {
    q,
    category: categories,
    location,
    date_from,
    date_to,
    sort,
  };
  const hasActive =
    q ||
    categories.length > 0 ||
    location ||
    date_from ||
    date_to ||
    sort === "oldest";

  return (
    <section className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
      <FiltersSidebar initial={initialFilters} />
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-semibold">Browse Items</h1>
          {hasActive && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {q && (
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                  q: “{q}”
                </span>
              )}
              {categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800"
                >
                  {c}
                </span>
              ))}
              {location && (
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                  {location}
                </span>
              )}
              {(date_from || date_to) && (
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                  {date_from || "…"} → {date_to || "…"}
                </span>
              )}
              <a href="/search" className="underline">
                Clear
              </a>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {loading
            ? "Searching…"
            : `${items.length} item${items.length === 1 ? "" : "s"} found`}
        </div>

        {err && <div className="p-4 text-red-500">Error: {err}</div>}

        {!loading && !err && items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No items match your filters.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.id}>
                <ItemCard item={it as any} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
