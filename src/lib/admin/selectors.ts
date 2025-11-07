import type { Item, Claim } from "@/lib/types";
import { CLAIM_BUCKET, FALLBACK_THUMB } from "./constants";
import { publicUrlFrom } from "./storage";

export type ItemStatusWidened =
  | Item["status"]
  | "pending"
  | "rejected"
  | "on_hold"
  | "claimed";

export function computeClaimThumbs(
  claims: Claim[],
  items: Item[],
  thumbMap: Record<number, string>
) {
  const map: Record<number, { itemThumb: string; proofs: string[] }> = {};
  for (const c of claims) {
    const item = items.find((i) => i.id === c.item_id);
    const itemThumb = item
      ? thumbMap[item.id] ?? FALLBACK_THUMB
      : FALLBACK_THUMB;

    let proofs: string[] = [];
    const raw = (c as any).proof as string | null | undefined;
    if (raw && String(raw).trim()) {
      try {
        const parsed = JSON.parse(String(raw));
        proofs = Array.isArray(parsed)
          ? parsed.map((p: string) => publicUrlFrom(CLAIM_BUCKET, p))
          : [publicUrlFrom(CLAIM_BUCKET, String(raw))];
      } catch {
        proofs = [publicUrlFrom(CLAIM_BUCKET, String(raw))];
      }
    }
    map[c.id] = { itemThumb, proofs };
  }
  return map;
}

export function computeVisibleItems(
  items: Item[],
  statusFilter: string,
  q: string
) {
  const needle = q.trim().toLowerCase();
  return items.filter((it) => {
    const s = it.status as ItemStatusWidened;
    const passStatus = statusFilter === "all" ? true : s === statusFilter;
    const passSearch =
      !needle ||
      [it.id, it.title, it.category, (it as any).location, it.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    return passStatus && passSearch;
  });
}

export function computeStats(items: Item[], claims: Claim[]) {
  const totalItems = items.length;
  const totalClaims = claims.length;
  let listed = 0,
    on_hold = 0,
    returned = 0,
    pending = 0,
    rejected = 0;

  const THIRTY_D_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - THIRTY_D_MS;
  const cat30 = new Map<string, number>();
  const loc30 = new Map<string, number>();

  for (const it of items) {
    const s = it.status as ItemStatusWidened;
    if (s === "listed") listed++;
    else if (s === "on_hold") on_hold++;
    else if (s === "pending") pending++;
    else if (s === "rejected") rejected++;

    const cat = (it.category ?? "Uncategorized").trim();
    const loc = ((it as any).location ?? "—").trim();

    const created = new Date(it.created_at).getTime();
    if (!Number.isNaN(created) && created >= cutoff) {
      cat30.set(cat, (cat30.get(cat) ?? 0) + 1);
      loc30.set(loc, (loc30.get(loc) ?? 0) + 1);
    }
  }

  const topCats = Array.from(cat30.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topLocs = Array.from(loc30.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    totalItems,
    totalClaims,
    listedCount: listed,
    onHoldCount: on_hold,
    returnedCount: returned,
    pendingCount: pending,
    rejectedCount: rejected,
    topCats,
    topLocs,
  };
}
