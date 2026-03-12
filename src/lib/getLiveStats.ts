import { supabase } from "@/lib/supabaseClient";

export type LiveStats = {
  totalItems: number;
  claimed: number;
  recent: number;
  claimRate: number;
};

export async function getLiveStats(): Promise<LiveStats> {
  const now = new Date();
  const past30 = new Date(now);
  past30.setDate(now.getDate() - 30);

  const past30ISO = past30.toISOString();

  const [totalRes, claimedRes, recentRes] = await Promise.all([
    supabase.from("items").select("*", { count: "exact", head: true }),

    // change this filter if your reunited status is named differently
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "claimed"),

    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .gte("created_at", past30ISO),
  ]);

  const totalItems = totalRes.count ?? 0;
  const claimed = claimedRes.count ?? 0;
  const recent = recentRes.count ?? 0;
  const claimRate =
    totalItems > 0 ? Math.round((claimed / totalItems) * 100) : 0;

  return {
    totalItems,
    claimed,
    recent,
    claimRate,
  };
}
