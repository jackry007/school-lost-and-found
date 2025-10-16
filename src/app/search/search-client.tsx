// app/search/search-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ItemCard } from "@/components/ItemCard";
import {
  FiltersSidebar,
  type FiltersInitial,
} from "@/components/FiltersSidebar";

/* ---------- Brand tokens (match home) ---------- */
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* ---------- Types ---------- */
type Row = {
  id: string | number;
  title: string | null;
  location_found: string | null;
  category: string | null;
  date_found: string | null;
  photo_url: string | null;
  status: string | null;
};

/* ---------- Small UI bits to mirror home ---------- */
function SectionHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="mb-5">
      {kicker && (
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: CREEK_NAVY }}
        >
          {kicker}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3">
        <svg
          width="28"
          height="32"
          viewBox="0 0 24 28"
          aria-hidden
          className="drop-shadow-sm"
        >
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
          {title}
        </h2>
      </div>
      <div
        className="mt-2 h-1 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
        }}
      />
    </div>
  );
}

function PaperGrid({ children }: { children: React.ReactNode }) {
  const dot = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${CREEK_NAVY}22'/></svg>`
  );
  return (
    <div
      className="rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,.05)]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${dot}")`,
        backgroundColor: "#fafbff",
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
      {children}
    </span>
  );
}

/* ---------- Component ---------- */
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
    <div
      className="min-h-screen"
      style={{
        // subtle page shell like home
        background:
          "linear-gradient(180deg, #0B2C5C0A 0%, #0B2C5C08 40%, #ffffff 100%)",
        backgroundImage:
          "radial-gradient(rgba(11,44,92,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <SectionHeader title="Browse Items" kicker="Search" />

        {/* Two-column layout like home sections */}
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
          <FiltersSidebar initial={initialFilters} />

          {/* Right column content in a PaperGrid for consistency */}
          <PaperGrid>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h1
                  className="text-xl font-semibold"
                  style={{ color: CREEK_NAVY }}
                >
                  Results
                </h1>

                {hasActive && (
                  <div className="flex flex-wrap items-center gap-2">
                    {q && <Pill>q: “{q}”</Pill>}
                    {categories.map((c) => (
                      <Pill key={c}>{c}</Pill>
                    ))}
                    {location && <Pill>{location}</Pill>}
                    {(date_from || date_to) && (
                      <Pill>
                        {date_from || "…"} → {date_to || "…"}
                      </Pill>
                    )}
                    <Link
                      href="/search"
                      className="text-sm underline"
                      style={{ color: CREEK_RED }}
                    >
                      Clear
                    </Link>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                {loading
                  ? "Searching…"
                  : `${items.length} item${
                      items.length === 1 ? "" : "s"
                    } found`}
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
                  Error: {err}
                </div>
              )}

              {!loading && !err && items.length === 0 ? (
                <div className="grid place-items-center rounded-2xl border border-dashed border-gray-300 py-16 text-center">
                  <div>
                    <p className="text-lg font-medium">
                      No items match your filters.
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Try adjusting your keywords or categories.
                    </p>
                    <Link
                      href="/search"
                      className="mt-4 inline-block rounded-lg px-4 py-2 text-white"
                      style={{ backgroundColor: CREEK_RED }}
                    >
                      Clear filters
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((it) => (
                    <li key={it.id}>
                      <ItemCard item={it as any} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PaperGrid>
        </div>
      </section>
    </div>
  );
}
