// app/search/search-client.tsx
"use client";

import { BASE } from "@/lib/basePath";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { ItemCard } from "@/components/ItemCard";
import {
  FiltersSidebar,
  type FiltersInitial,
} from "@/components/FiltersSidebar";
import { uniqueLabels, normalize } from "@/utils/unique";

const BUCKET = "item-photos";
const FALLBACK = `${BASE}/no-image.png`;
const PAGE_SIZE = 20;

/* ---------- Brand tokens ---------- */
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* ---------- Types ---------- */
type Row = {
  id: string | number;
  title: string | null;
  location: string | null;
  category: string | null;
  date_found: string | null;
  photo_url: string | null;
  status: string | null;
};

type ItemView = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  thumb: string;
};

/* ---------- Motion ---------- */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerWrap: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

const cardMotion: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};

const pillMotion: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 6 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ---------- Small UI bits ---------- */
function SectionHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <motion.div
      className="mb-5"
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      {kicker && (
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm"
          style={{ backgroundColor: CREEK_NAVY }}
        >
          {kicker}
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <motion.svg
          width="28"
          height="32"
          viewBox="0 0 24 28"
          aria-hidden
          className="drop-shadow-sm"
          initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
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
        </motion.svg>

        <h2
          className="text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ color: CREEK_NAVY }}
        >
          {title}
        </h2>
      </div>

      <motion.div
        className="mt-2 h-1 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
        }}
        initial={{ scaleX: 0.4, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
      />
    </motion.div>
  );
}

function PaperGrid({ children }: { children: React.ReactNode }) {
  const dot = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${CREEK_NAVY}22'/></svg>`,
  );

  return (
    <motion.div
      className="rounded-3xl border border-[rgba(11,44,92,0.10)] p-6 shadow-[0_14px_34px_rgba(0,0,0,.05)] sm:p-8"
      style={{
        backgroundImage: `url("data:image/svg+xml,${dot}")`,
        backgroundColor: "#fafbff",
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {children}
    </motion.div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-sm shadow-sm ring-1 ring-gray-200">
      {children}
    </span>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-40 animate-pulse bg-slate-200" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
  if (currentPage >= totalPages - 3) {
    return [
      1,
      -1,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}

/* ---------- Component ---------- */
export default function SearchClient() {
  const sp = useSearchParams();
  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  const q = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);
  const location = useMemo(() => (sp.get("location") ?? "").trim(), [sp]);
  const date_from = useMemo(() => (sp.get("date_from") ?? "").trim(), [sp]);
  const date_to = useMemo(() => (sp.get("date_to") ?? "").trim(), [sp]);
  const sort: "newest" | "oldest" =
    sp.get("sort") === "oldest" ? "oldest" : "newest";

  const categoriesRaw = useMemo(() => {
    const all = sp.getAll("category").filter(Boolean);

    if (all.length === 0) {
      const single = sp.get("category");
      if (single?.includes(",")) {
        return single
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (single) return [single];
    }

    return all;
  }, [sp]);

  const categories = useMemo(
    () => uniqueLabels(categoriesRaw),
    [categoriesRaw],
  );

  const [items, setItems] = useState<ItemView[]>([]);
  const [page, setPage] = useState(1);
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
        .select("id,title,location,category,date_found,photo_url,status")
        .eq("status", "listed");

      if (q) {
        const safeQ = q.replaceAll(",", " ");
        query = query.or(
          `title.ilike.%${safeQ}%,location.ilike.%${safeQ}%,category.ilike.%${safeQ}%`,
        );
      }

      if (categories.length) query = query.in("category", categories);
      if (location) query = query.ilike("location", `%${location}%`);
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
        setItems([]);
        setLoading(false);
        return;
      }

      const mapped: ItemView[] =
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
            location: String(row.location ?? "—"),
            category: String(row.category ?? "Misc"),
            date: row.date_found
              ? new Date(row.date_found).toISOString().slice(0, 10)
              : "",
            thumb,
          };
        }) ?? [];

      setItems(mapped);
      setPage(1);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [q, categories, location, date_from, date_to, sort]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pagedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  const pageNumbers = useMemo(
    () => getVisiblePageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

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

  const scrollResultsToTop = () => {
    resultsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages));
    setPage(safePage);
    requestAnimationFrame(() => {
      scrollResultsToTop();
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #0B2C5C0A 0%, #0B2C5C08 40%, #ffffff 100%)",
        backgroundImage:
          "radial-gradient(rgba(11,44,92,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader title="Browse Items" kicker="Search" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24 }}
          >
            <FiltersSidebar initial={initialFilters} />
          </motion.div>

          <PaperGrid>
            <div ref={resultsTopRef} className="space-y-5">
              <motion.div
                className="flex flex-wrap items-start justify-between gap-3"
                variants={fadeUp}
                initial="hidden"
                animate="show"
              >
                <div>
                  <h1
                    className="text-xl font-semibold"
                    style={{ color: CREEK_NAVY }}
                  >
                    Results
                  </h1>
                  <div className="mt-1 text-sm text-gray-600">
                    {loading
                      ? "Searching…"
                      : items.length === 0
                        ? "0 items found"
                        : `Showing ${startIndex + 1}-${Math.min(
                            endIndex,
                            items.length,
                          )} of ${items.length} items`}
                  </div>
                </div>

                {hasActive && (
                  <motion.div
                    className="flex flex-wrap items-center gap-2"
                    variants={staggerWrap}
                    initial="hidden"
                    animate="show"
                  >
                    {q && (
                      <motion.div variants={pillMotion}>
                        <Pill>q: “{q}”</Pill>
                      </motion.div>
                    )}

                    {categories.map((c) => (
                      <motion.div
                        key={`pill-${normalize(c)}`}
                        variants={pillMotion}
                      >
                        <Pill>{c}</Pill>
                      </motion.div>
                    ))}

                    {location && (
                      <motion.div variants={pillMotion}>
                        <Pill>{location}</Pill>
                      </motion.div>
                    )}

                    {(date_from || date_to) && (
                      <motion.div variants={pillMotion}>
                        <Pill>
                          {date_from || "…"} → {date_to || "…"}
                        </Pill>
                      </motion.div>
                    )}

                    {sort === "oldest" && (
                      <motion.div variants={pillMotion}>
                        <Pill>Oldest first</Pill>
                      </motion.div>
                    )}

                    <motion.div variants={pillMotion}>
                      <Link
                        href="/search"
                        className="text-sm font-medium underline underline-offset-2"
                        style={{ color: CREEK_RED }}
                      >
                        Clear
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ResultsSkeleton />
                  </motion.div>
                ) : err ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700"
                  >
                    Error: {err}
                  </motion.div>
                ) : items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 12, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid place-items-center rounded-2xl border border-dashed border-gray-300 bg-white/70 py-16 text-center"
                  >
                    <div>
                      <motion.div
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.04, duration: 0.2 }}
                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl"
                      >
                        🔎
                      </motion.div>
                      <p className="text-lg font-medium text-slate-900">
                        No items match your filters.
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Try adjusting your keywords or categories.
                      </p>
                      <Link
                        href="/search"
                        className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        style={{ backgroundColor: CREEK_RED }}
                      >
                        Clear filters
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`page-${currentPage}`}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    variants={staggerWrap}
                  >
                    <motion.ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {pagedItems.map((it) => (
                        <motion.li
                          key={it.id}
                          variants={cardMotion}
                          layout
                          whileHover={{ y: -3 }}
                          transition={{ duration: 0.18 }}
                        >
                          <ItemCard item={it as any} />
                        </motion.li>
                      ))}
                    </motion.ul>

                    {totalPages > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.06 }}
                        className="mt-8 flex flex-col items-center gap-4"
                      >
                        <div className="text-sm text-slate-500">
                          Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                            style={{
                              borderColor: "rgba(11,44,92,0.18)",
                              color: CREEK_NAVY,
                              backgroundColor: "#fff",
                            }}
                          >
                            Prev
                          </button>

                          {pageNumbers.map((num, idx) =>
                            num === -1 ? (
                              <span
                                key={`ellipsis-${idx}`}
                                className="px-2 text-sm text-slate-400"
                              >
                                ...
                              </span>
                            ) : (
                              <button
                                key={num}
                                type="button"
                                onClick={() => goToPage(num)}
                                className="min-w-[42px] rounded-xl px-3 py-2 text-sm font-semibold transition"
                                style={
                                  num === currentPage
                                    ? {
                                        color: "#fff",
                                        background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
                                        boxShadow:
                                          "0 8px 20px rgba(11,44,92,0.18)",
                                      }
                                    : {
                                        color: CREEK_NAVY,
                                        backgroundColor: "#fff",
                                        border: "1px solid rgba(11,44,92,0.18)",
                                      }
                                }
                              >
                                {num}
                              </button>
                            ),
                          )}

                          <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                            style={{
                              borderColor: "rgba(11,44,92,0.18)",
                              color: CREEK_NAVY,
                              backgroundColor: "#fff",
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </PaperGrid>
        </div>
      </section>
    </div>
  );
}
