// src/lib/imageUrl.ts
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "item-photos";

export function toPublicUrl(path?: string | null) {
  if (!path) return null;
  // If a full URL was saved, just return it
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
