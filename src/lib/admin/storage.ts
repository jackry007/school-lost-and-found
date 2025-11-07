import { supabase } from "@/lib/supabaseClient";
import { FALLBACK_THUMB } from "./constants";

export function publicUrlFrom(bucket: string, path?: string | null) {
  if (!path) return FALLBACK_THUMB;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || FALLBACK_THUMB;
}
