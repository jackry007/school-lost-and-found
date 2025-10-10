"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { Item } from "@/lib/types";

// ✅ your Supabase bucket name
const BUCKET = "item-photos";

export default function RecentItems() {
  const [items, setItems] = useState<Item[]>([]);

  // Fetch the 10 most recent items
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("status", "listed") // only show listed items
        .order("date_found", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading items:", error.message);
        return;
      }

      setItems(data || []);
    };

    fetchItems();
  }, []);

  // Helper to get Supabase public URL
  const getPublicUrl = (path?: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Recently reported</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => {
          const imgUrl = getPublicUrl(item.photo_url);

          return (
            <article
              key={item.id}
              className="border rounded-xl overflow-hidden bg-[#111] hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="relative aspect-[4/3] bg-neutral-800">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={(e) => {
                      // Hide broken image icons
                      (e.currentTarget as any).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-400">
                    No image
                  </div>
                )}
              </div>

              <div className="p-3">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-neutral-400">
                  {item.location_found ?? "—"} • {item.category ?? "Misc"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Found {new Date(item.date_found).toLocaleDateString()}
                </p>
              </div>
            </article>
          );
        })}

        {items.length === 0 && (
          <div className="text-neutral-400 text-center col-span-full py-6">
            No items found yet.
          </div>
        )}
      </div>
    </section>
  );
}
