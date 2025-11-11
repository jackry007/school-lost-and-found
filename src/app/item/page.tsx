// /app/item/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = "item-photos";
const FALLBACK_IMG = `${BASE}/no-image.png`;

type Row = {
  id: number;
  title: string | null;
  category: string | null;
  location: string | null;
  date_found: string | null;
  photo_url: string | null;
  description: string | null;
  notes: string | null;
  status: string | null;
};

function publicUrlFromPath(path?: string | null) {
  if (!path) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function fetchItem(id: string): Promise<Row | null> {
  const url = `${SB_URL}/rest/v1/items?id=eq.${encodeURIComponent(
    id
  )}&select=*`;
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Row[];
  return rows?.[0] ?? null;
}

/** Outer page: Suspense wrapper satisfies Next 15 CSR bailout rules */
export default function ItemPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            Loading item…
          </div>
        </main>
      }
    >
      <ItemPageInner />
    </Suspense>
  );
}

/** Inner page: the only place we call useSearchParams() */
function ItemPageInner() {
  const sp = useSearchParams();
  const id = useMemo(() => sp.get("id")?.trim() ?? "", [sp]);

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    window?.scrollTo?.({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    if (!id) {
      setErr("Missing item id.");
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setErr(null);
    fetchItem(id)
      .then((r) => {
        if (!alive) return;
        if (!r) setErr("Item not found.");
        setRow(r ?? null);
      })
      .catch((e) => alive && setErr(e?.message || "Failed to load item."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const title = row?.title ?? (id ? `Item #${id}` : "Item");
  const location = row?.location ?? "—";
  const category = row?.category ?? "Misc";
  const date = row?.date_found
    ? new Date(row.date_found).toLocaleDateString()
    : "—";
  const desc = (row?.description || row?.notes || "").trim();
  const img = publicUrlFromPath(row?.photo_url);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`${BASE}/search`}
          className="text-sm underline decoration-dotted underline-offset-4"
          style={{ color: "#0B2C5C" }}
        >
          ← Back to Search
        </Link>
      </div>

      {!id && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          No item id provided.
        </div>
      )}

      {id && loading && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          Loading item…
        </div>
      )}

      {id && err && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {err}
        </div>
      )}

      {id && !loading && !err && row && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-2 shadow-sm">
            <img
              src={img}
              alt={title}
              className="h-[420px] w-full rounded-xl bg-gray-50 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
            />
          </div>

          <article className="rounded-2xl border bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {location} • {category}
            </p>
            <p className="text-xs text-gray-500">Found {date}</p>

            <div className="mt-5">
              <h2 className="text-base font-medium">Description</h2>
              <p className="mt-1 text-sm leading-6 text-gray-800">
                {desc || "No description provided."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`${BASE}/claim?item=${encodeURIComponent(id)}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#BF1E2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Start claim
              </Link>
              <Link
                href={`${BASE}/search`}
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Back to search
              </Link>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
