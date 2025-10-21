// app/items/[id]/page.tsx
// Static item detail page for GitHub Pages (output: "export")
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/* ---------- Supabase REST helpers (build-time only) ---------- */
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = "item-photos";
const FALLBACK_IMG = "/no-image.png"; // keep this in /public

async function sb<T = any>(path: string): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    // Static export needs cached fetches
    cache: "force-cache",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

function publicUrlFromPath(path?: string | null) {
  if (!path) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(path)) return path;
  // public bucket URL
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/* ---------- Types ---------- */
type Row = {
  id: number;
  title: string | null;
  category: string | null;
  location: string | null; // if your column is location_found, change both places
  date_found: string | null;
  photo_url: string | null;
  description: string | null;
  notes: string | null;
  status: string | null;
};

/* ---------- Static params for all visible items ---------- */
export async function generateStaticParams() {
  // Build pages for recently listed/claimed items (adjust filter as you like)
  // PostgREST: status=in.(listed,claimed) is done with or= filter
  const rows = await sb<Row[]>(
    `items?select=id,status&or=(status.eq.listed,status.eq.claimed)&order=id.desc&limit=200`
  );
  return rows.map((r) => ({ id: String(r.id) }));
}

/* ---------- Optional: better titles in static export ---------- */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const [row] = await sb<Row[]>(
    `items?id=eq.${encodeURIComponent(params.id)}&select=title`
  );
  const title = row?.title ?? `Item #${params.id}`;
  return { title: `${title} • Lost & Found` };
}

/* ---------- Page ---------- */
export default async function ItemPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  const rows = await sb<Row[]>(
    `items?id=eq.${id}&select=id,title,category,location,date_found,photo_url,description,notes,status`
  );

  const row = rows[0];
  if (!row) return notFound();

  const img = publicUrlFromPath(row.photo_url);
  const title = row.title ?? `Item #${params.id}`;
  const location = row.location ?? "—";
  const category = row.category ?? "Misc";
  const date = row.date_found
    ? new Date(row.date_found).toLocaleDateString()
    : "—";
  const desc = (row.description || row.notes || "").trim();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-2 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={title}
            className="h-[420px] w-full rounded-xl object-contain bg-gray-50"
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
            <a
              href={`/claim?item=${params.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Start claim
            </a>
            <a
              href="/search"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to search
            </a>
          </div>
        </article>
      </div>
    </main>
  );
}
