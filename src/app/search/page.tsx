// src/app/search/page.tsx
import { supabase } from "@/lib/supabaseClient";
import { ItemCard } from "@/components/ItemCard";

export const metadata = { title: "Search Found Items" };

type QS = { q?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<QS>;
}) {
  const sp = await searchParams; // ✅ await first
  const q = (sp?.q ?? "").trim();

  // query
  let query = supabase
    .from("items")
    .select(
      "id, title, location_found, category, date_found, photo_url, status"
    )
    .eq("status", "listed")
    .order("date_found", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;

  // map rows -> ItemCard shape + build public URL for storage paths
  const items = (data ?? []).map((row: any) => {
    const BUCKET = "item-photos";
    const FALLBACK = "/no-image.png";

    let thumb = FALLBACK;
    const path: string | null = row.photo_url ?? null;
    if (path) {
      if (/^https?:\/\//i.test(path)) thumb = path;
      else {
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
  });

  if (!items.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        {q ? <>No items found for “{q}”.</> : <>No items yet.</>}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Search Results</h1>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.id}>
            <ItemCard item={it} />
          </li>
        ))}
      </ul>
    </section>
  );
}
