// src/app/page.tsx  (Home: search & list)
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ItemCard from "@/components/ItemCard";
import type { Item } from "@/lib/types";

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");

  const fetchItems = async () => {
    let query = supabase
      .from("items")
      .select("*")
      .eq("status", "listed")
      .order("created_at", { ascending: false });

    if (q.trim()) {
      // simple title/description search
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error.message);
      return;
    }
    setItems((data as Item[]) ?? []);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items"
          className="flex-1 border rounded-xl p-2"
        />
        <button onClick={fetchItems} className="border rounded-xl px-3">
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <ItemCard key={it.id} item={it} />
        ))}
      </div>
    </div>
  );
}
