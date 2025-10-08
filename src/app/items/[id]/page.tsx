// src/app/items/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Item } from "@/lib/types";
import ClaimForm from "@/components/ClaimForm";

export default function ItemDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!id) return;
    const get = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error(error.message);
        return;
      }
      setItem((data as Item) ?? null);
    };
    get();
  }, [id]);

  if (!item) return <div>Loading…</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        {item.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo_url} alt={item.title} className="rounded-xl" />
        )}
        <h1 className="text-2xl font-bold mt-3">{item.title}</h1>
        <p className="mt-2 text-gray-700 whitespace-pre-wrap">
          {item.description}
        </p>
        <div className="text-sm text-gray-500 mt-2">
          Found at {item.location_found ?? "—"} on{" "}
          {new Date(item.date_found).toLocaleDateString()}
        </div>
      </div>

      <div>
        {item.status === "listed" ? (
          <>
            <h2 className="text-xl font-semibold mb-2">Claim this item</h2>
            <ClaimForm itemId={item.id} />
          </>
        ) : (
          <div className="p-4 border rounded-xl bg-gray-50">
            This item has been claimed.
          </div>
        )}
      </div>
    </div>
  );
}
