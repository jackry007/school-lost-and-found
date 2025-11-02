// src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Item, Claim } from "@/lib/types";

/* =========================================================
   Types / palette
   ======================================================= */
type ItemStatusWidened = Item["status"] | "pending" | "rejected";
type StatusFilter = "all" | "pending" | "listed" | "claimed" | "rejected";

const CREEK_RED = "#b10015"; // deep scarlet
const CREEK_NAVY = "#0f2741"; // dark navy
const CREEK_SOFTR = "#fef2f3"; // soft red tint
const CREEK_SOFTN = "#f1f5fb"; // soft navy tint

// ---------- Images (Supabase Storage) ----------
const BUCKET = "item-photos";
const CLAIM_BUCKET = "claim-photos"; // change if your proof photos live elsewhere

const FALLBACK_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle'
            font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
            font-size='12' fill='#9ca3af'>no image</text>
    </svg>`
  );

function publicUrlFrom(bucket: string, path?: string | null) {
  if (!path) return FALLBACK_THUMB;
  if (/^https?:\/\//i.test(path)) return path; // already a URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || FALLBACK_THUMB;
}

/* =========================================================
   Tiny Toast system (self-contained)
   ======================================================= */
type Toast = {
  id: number;
  msg: string;
  actionLabel?: string;
  onAction?: () => void;
};

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (
    msg: string,
    opts?: { actionLabel?: string; onAction?: () => void; ttl?: number }
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [
      ...t,
      { id, msg, actionLabel: opts?.actionLabel, onAction: opts?.onAction },
    ]);
    const ttl = opts?.ttl ?? 3000;
    if (!opts?.onAction) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
    }
    return id;
  };
  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const node = (
    <div className="fixed right-3 top-3 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-md bg-gray-900/95 px-3 py-2 text-sm text-white shadow-lg"
        >
          <span>{t.msg}</span>
          {t.actionLabel && (
            <button
              className="rounded border border-white/20 px-2 py-0.5 text-xs hover:bg-white/10"
              onClick={() => {
                t.onAction?.();
                remove(t.id);
              }}
            >
              {t.actionLabel}
            </button>
          )}
          <button
            className="ml-1 rounded px-2 py-0.5 text-xs text-white/70 hover:bg-white/10"
            onClick={() => remove(t.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
  return { add, remove, node };
}

/* =========================================================
   Confirm Modal (no window.confirm)
   ======================================================= */
function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[95%] max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div
            className="px-4 py-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
            }}
          >
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <div className="p-4 text-sm text-gray-800">{children}</div>
          <div className="flex justify-end gap-2 p-4 pt-0">
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              onClick={onConfirm}
              disabled={busy}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              style={{ backgroundColor: CREEK_RED }}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page
   ======================================================= */
export default function AdminPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "staff" | "user" | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // filters / search / edit
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [q, setQ] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});

  // approve modal state
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveBusy, setApproveBusy] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Item | null>(null);

  // toasts
  const { add: addToast, node: toastNode } = useToasts();

  // thumbnails cache: item.id -> public url
  const [thumbMap, setThumbMap] = useState<Record<number, string>>({});

  // ----- Photo lightbox -----
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoTitle, setPhotoTitle] = useState<string>("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  function openPhotos(title: string, urls: string[]) {
    setPhotoTitle(title);
    setPhotoUrls(urls);
    setPhotoOpen(true);
  }

  // ----- Schedule modal (only schedule_at) -----
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedClaim, setSchedClaim] = useState<Claim | null>(null);
  const [schedAt, setSchedAt] = useState(""); // HTML datetime-local
  const [schedBusy, setSchedBusy] = useState(false);

  function openSchedule(c: Claim) {
    setSchedClaim(c);
    const at = (c as any).schedule_at as string | null | undefined;
    setSchedAt(at ? new Date(at).toISOString().slice(0, 16) : "");
    setSchedOpen(true);
  }

  async function saveSchedule() {
    if (!schedClaim) return;
    setSchedBusy(true);
    const iso = schedAt ? new Date(schedAt).toISOString() : null;

    const { error } = await supabase
      .from("claims")
      .update({ schedule_at: iso })
      .eq("id", schedClaim.id);

    setSchedBusy(false);
    if (error) return addToast(`Error scheduling: ${error.message}`);

    addToast(
      iso
        ? `Pickup scheduled for claim #${schedClaim.id}`
        : `Pickup cleared for claim #${schedClaim.id}`
    );
    setSchedOpen(false);
    setSchedClaim(null);
    load(); // refresh list to show chip
  }

  /* ---------------- Auth + load ---------------- */
  const load = async () => {
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      router.replace("/auth/login");
      return;
    }

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("uid", uid)
      .single();

    if (profErr || !prof || !["admin", "staff"].includes(prof.role)) {
      alert("Not authorized");
      router.replace("/");
      return;
    }
    setRole(prof.role as "admin" | "staff");

    const [{ data: its }, { data: cls }] = await Promise.all([
      supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    setItems((its as Item[]) || []);
    setClaims((cls as Claim[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // build/refresh thumbnail map whenever items change
  useEffect(() => {
    const next: Record<number, string> = {};
    for (const it of items) {
      const path = (it as any).photo_url as string | null | undefined;
      if (!path) {
        next[it.id] = FALLBACK_THUMB;
        continue;
      }
      if (/^https?:\/\//i.test(path)) {
        next[it.id] = path;
      } else {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        next[it.id] = data?.publicUrl || FALLBACK_THUMB;
      }
    }
    setThumbMap(next);
  }, [items]);

  /* ---------------- Helpers: optimistic moves ---------------- */
  function moveItemLocally(id: number, status: ItemStatusWidened) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? ({ ...it, status } as Item) : it))
    );
  }

  /* ---------------- Actions ---------------- */
  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setItems([]);
    setClaims([]);
    router.replace("/");
  };

  const updateClaim = async (id: number, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("claims")
      .update({ status })
      .eq("id", id);
    if (error) return addToast(`Claim update failed: ${error.message}`);
    addToast(`Claim #${id} → ${status}`);
    load();
  };

  const markItemClaimed = async (id: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "claimed" })
      .eq("id", id);
    if (error) return addToast(`Error: ${error.message}`);
    moveItemLocally(id, "claimed");
    addToast(`Item #${id} marked claimed.`);
  };

  const restoreToListed = async (id: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);
    if (error) return addToast(`Error: ${error.message}`);
    moveItemLocally(id, "listed");
    addToast(`Item #${id} restored to Listed.`);
  };

  // OPEN modal for approve/reject
  const askApprove = (it: Item) => {
    setApproveTarget(it);
    setApproveOpen(true);
  };

  // Approve & List with optimistic + undo
  const confirmApprove = async () => {
    if (!approveTarget) return;
    const id = approveTarget.id;
    setApproveBusy(true);

    // optimistic move
    moveItemLocally(id, "listed");
    setApproveOpen(false);
    setApproveBusy(false);

    // show undo toast (5s)
    let undone = false;
    addToast(`Approved: “${approveTarget.title}”`, {
      actionLabel: "Undo (5s)",
      ttl: 5000,
      onAction: async () => {
        undone = true;
        await supabase.from("items").update({ status: "pending" }).eq("id", id);
        moveItemLocally(id, "pending");
      },
    });

    // persist
    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);
    if (error) {
      // revert optimistic on error
      moveItemLocally(id, "pending");
      addToast(`Error listing item: ${error.message}`);
      return;
    }

    // if no undo after 5s, nothing else to do
  };

  // Reject
  const updateItemStatus = async (id: number, status: "rejected") => {
    const { error } = await supabase
      .from("items")
      .update({ status })
      .eq("id", id);
    if (error) return addToast(`Error: ${error.message}`);
    moveItemLocally(id, "rejected");
    addToast(`Item #${id} → rejected`);
  };

  // Inline Edit
  const openEdit = (it: Item) => {
    setEditItem(it);
    setEditForm({
      title: it.title,
      category: it.category,
      // @ts-expect-error your table has location
      location: (it as any).location ?? null,
      description: it.description,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const payload: Partial<Item> = {
      title: editForm.title ?? editItem.title,
      category: editForm.category ?? editItem.category,
      // @ts-expect-error ensure your table column is "location"
      location:
        (editForm as any).location ?? (editItem as any).location ?? null,
      description: editForm.description ?? editItem.description,
    };
    const { error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", editItem.id);
    if (error) return addToast(`Save failed: ${error.message}`);
    setEditOpen(false);
    setEditItem(null);
    setEditForm({});
    setItems((prev) =>
      prev.map((it) =>
        it.id === editItem.id ? ({ ...it, ...payload } as Item) : it
      )
    );
    addToast("Changes saved.");
  };

  /* ---------------- Derived ---------------- */
  const pendingItems = items.filter(
    (i) => (i.status as ItemStatusWidened) === "pending"
  );
  const pendingClaims = claims.filter((c) => c.status === "pending");

  // Build thumbs per claim: item photo + proof photos
  const claimThumbs = useMemo(() => {
    const map: Record<number, { itemThumb: string; proofs: string[] }> = {};
    for (const c of claims) {
      const item = items.find((i) => i.id === c.item_id);
      const itemThumb = item
        ? thumbMap[item.id] ?? FALLBACK_THUMB
        : FALLBACK_THUMB;

      let proofs: string[] = [];
      if (c.proof && c.proof.trim()) {
        try {
          const parsed = JSON.parse(c.proof);
          if (Array.isArray(parsed)) {
            proofs = parsed.map((p: string) => publicUrlFrom(CLAIM_BUCKET, p));
          } else {
            proofs = [publicUrlFrom(CLAIM_BUCKET, c.proof)];
          }
        } catch {
          proofs = [publicUrlFrom(CLAIM_BUCKET, c.proof)];
        }
      }

      map[c.id] = { itemThumb, proofs };
    }
    return map;
  }, [claims, items, thumbMap]);

  const visibleItems = useMemo(() => {
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
  }, [items, statusFilter, q]);

  const {
    totalItems,
    totalClaims,
    listedCount,
    claimedCount,
    pendingCount,
    rejectedCount,
    returnRatePct,
    topCats,
    topLocs,
  } = useMemo(() => {
    const totalItems = items.length;
    const totalClaims = claims.length;

    let listed = 0,
      claimed = 0,
      pending = 0,
      rejected = 0;

    const THIRTY_D_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_D_MS;

    const cat30 = new Map<string, number>();
    const loc30 = new Map<string, number>();

    for (const it of items) {
      const s = it.status as ItemStatusWidened;
      if (s === "listed") listed++;
      else if (s === "claimed") claimed++;
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

    const denom = listed + claimed;
    const returnRatePct = denom ? Math.round((claimed / denom) * 100) : 0;

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
      claimedCount: claimed,
      pendingCount: pending,
      rejectedCount: rejected,
      returnRatePct,
      topCats,
      topLocs,
    };
  }, [items, claims]);

  /* ---------------- Render ---------------- */
  if (loading) {
    return (
      <div className="min-h-[60vh]">
        <Header role={role} onSignOut={signOut} />
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header role={role} onSignOut={signOut} />

      <main className="mx-auto max-w-6xl space-y-10 p-6">
        {/* Analytics */}
        <section>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total items"
              value={totalItems}
              tint={CREEK_SOFTN}
            />
            <StatCard
              label="Total claims"
              value={totalClaims}
              tint={CREEK_SOFTR}
            />
            <StatCard label="Listed" value={listedCount} tint="#eef7ff" />
            <StatCard label="Claimed" value={claimedCount} tint="#eefcf3" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Pending" value={pendingCount} tint="#fff6e8" />
            <StatCard label="Rejected" value={rejectedCount} tint="#fdeff0" />
            <StatCard
              label="Return rate"
              value={`${returnRatePct}%`}
              tint="#f5f7ff"
            />
            <Card className="p-4">
              <div className="mb-2 text-xs text-gray-500">
                Top categories (30d)
              </div>
              {topCats.length ? (
                <ul className="space-y-1 text-sm">
                  {topCats.map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="truncate">{k}</span>
                      <span className="ml-2 text-gray-700">{v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-600">—</div>
              )}
            </Card>
          </div>

          <Card className="mt-4 p-4">
            <div className="mb-2 text-xs text-gray-500">
              Top locations (30d)
            </div>
            {topLocs.length ? (
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {topLocs.map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="truncate">{k}</span>
                    <span className="ml-2 text-gray-700">{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">—</div>
            )}
          </Card>
        </section>

        {/* Moderation queues */}
        <section className="space-y-6">
          <SectionHeading>
            Pending Items <Badge tone="amber">{pendingItems.length}</Badge>
          </SectionHeading>
          <div className="space-y-3">
            {pendingItems.length === 0 && <EmptyRow text="No pending items." />}
            {pendingItems.map((it) => (
              <Row key={it.id}>
                <div className="flex items-center">
                  <Thumb src={thumbMap[it.id]} alt={it.title} />
                  <RowInfo
                    title={`#${it.id} · ${it.title}`}
                    meta={`${it.category ?? "—"} · ${
                      (it as any).location ?? "—"
                    } · submitted ${new Date(it.created_at).toLocaleString()}`}
                  />
                </div>
                <RowActions>
                  <Btn tone="primary" onClick={() => askApprove(it)}>
                    Approve &amp; List
                  </Btn>
                  <Btn
                    tone="danger"
                    onClick={() => updateItemStatus(it.id, "rejected")}
                  >
                    Reject
                  </Btn>
                  <Btn tone="ghost" onClick={() => openEdit(it)}>
                    Edit
                  </Btn>
                </RowActions>
              </Row>
            ))}
          </div>

          <SectionHeading>
            Pending Claims <Badge tone="amber">{pendingClaims.length}</Badge>
          </SectionHeading>
          <div className="space-y-3">
            {pendingClaims.length === 0 && (
              <EmptyRow text="No pending claims." />
            )}

            {pendingClaims.map((c) => {
              const t = claimThumbs[c.id];
              const sched = (c as any).schedule_at as string | null | undefined;
              const schedChip = sched ? new Date(sched).toLocaleString() : null;

              return (
                <Row key={c.id}>
                  {/* Left: item thumb + info */}
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumb src={t?.itemThumb} alt={`Item #${c.item_id}`} />
                    <RowInfo
                      title={
                        <>
                          Claim #{c.id} → Item #{c.item_id}
                          {schedChip && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">
                              {schedChip}
                            </span>
                          )}
                        </>
                      }
                      meta={
                        <>
                          {c.claimant_name} ({c.claimant_email})
                          {c.proof && (
                            <>
                              {" "}
                              ·{" "}
                              <span className="text-gray-500">
                                proof attached
                              </span>
                            </>
                          )}
                        </>
                      }
                    />
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Proof viewer */}
                    {t?.proofs?.length > 0 && (
                      <button
                        className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        onClick={() =>
                          openPhotos(`Proof photos — Claim #${c.id}`, t.proofs)
                        }
                        title="View proof photos"
                      >
                        View Proofs ({t.proofs.length})
                      </button>
                    )}

                    {/* Schedule / Reschedule */}
                    <Btn tone="ghost" onClick={() => openSchedule(c)}>
                      {schedChip ? "Reschedule" : "Schedule"}
                    </Btn>

                    <Btn
                      tone="primary"
                      onClick={() => updateClaim(c.id, "approved")}
                    >
                      Approve
                    </Btn>
                    <Btn
                      tone="danger"
                      onClick={() => updateClaim(c.id, "rejected")}
                    >
                      Reject
                    </Btn>
                  </div>
                </Row>
              );
            })}
          </div>
        </section>

        {/* Filters + items */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "all",
                  "pending",
                  "listed",
                  "claimed",
                  "rejected",
                ] as StatusFilter[]
              ).map((sf) => (
                <Pill
                  key={sf}
                  active={statusFilter === sf}
                  onClick={() => setStatusFilter(sf)}
                >
                  {sf[0].toUpperCase() + sf.slice(1)}
                </Pill>
              ))}
            </div>
            <div className="relative w-full sm:w-80">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search items…"
                className="w-full rounded-full border px-4 py-2 pl-10 outline-none focus:ring-2"
                style={{ borderColor: "#e5e7eb" }}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {visibleItems.length === 0 && (
              <EmptyRow text="No items match your filters." />
            )}
            {visibleItems.map((it) => {
              const s = it.status as ItemStatusWidened;
              return (
                <Row key={it.id}>
                  <div className="flex items-center">
                    <Thumb src={thumbMap[it.id]} alt={it.title} />
                    <RowInfo
                      title={`#${it.id} · ${it.title}`}
                      meta={
                        <>
                          <StatusBadge status={s} /> · {it.category ?? "—"} ·{" "}
                          {(it as any).location ?? "—"}
                        </>
                      }
                    />
                  </div>
                  <RowActions>
                    {s === "pending" && (
                      <>
                        <Btn tone="primary" onClick={() => askApprove(it)}>
                          Approve &amp; List
                        </Btn>
                        <Btn
                          tone="danger"
                          onClick={() => updateItemStatus(it.id, "rejected")}
                        >
                          Reject
                        </Btn>
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                      </>
                    )}
                    {s === "listed" && (
                      <>
                        <Btn
                          tone="primary"
                          onClick={() => markItemClaimed(it.id)}
                        >
                          Mark Claimed
                        </Btn>
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                      </>
                    )}
                    {s === "claimed" && (
                      <>
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                        <Btn
                          tone="secondary"
                          onClick={() => restoreToListed(it.id)}
                        >
                          Restore to Listed
                        </Btn>
                      </>
                    )}
                    {s === "rejected" && (
                      <Btn
                        tone="secondary"
                        onClick={() => restoreToListed(it.id)}
                      >
                        Restore to Listed
                      </Btn>
                    )}
                  </RowActions>
                </Row>
              );
            })}
          </div>
        </section>
      </main>

      {/* Edit Modal */}
      {editOpen && editItem && (
        <Modal
          onClose={() => setEditOpen(false)}
          title={`Edit Item #${editItem.id}`}
        >
          <div className="grid gap-3">
            <Labeled label="Title">
              <input
                className="rounded-xl border px-3 py-2"
                value={editForm.title ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Labeled>

            <Labeled label="Category">
              <input
                className="rounded-xl border px-3 py-2"
                value={editForm.category ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </Labeled>

            <Labeled label="Location">
              <input
                className="rounded-xl border px-3 py-2"
                value={((editForm as any).location ?? "") as string}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    ...({ location: e.target.value } as any),
                  }))
                }
              />
            </Labeled>

            <Labeled label="Description">
              <textarea
                className="min-h-28 rounded-xl border px-3 py-2"
                value={editForm.description ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Labeled>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Btn tone="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Btn>
            <Btn tone="primary" onClick={saveEdit}>
              Save changes
            </Btn>
          </div>
        </Modal>
      )}

      {/* Photo Lightbox */}
      {photoOpen && (
        <Modal title={photoTitle} onClose={() => setPhotoOpen(false)}>
          {photoUrls.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {photoUrls.map((u, i) => (
                <div key={i} className="overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="w-full object-contain" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No photos attached.</div>
          )}
        </Modal>
      )}

      {/* Schedule Modal (only date/time) */}
      {schedOpen && (
        <Modal
          title={`Schedule Pickup — Claim #${schedClaim?.id}`}
          onClose={() => setSchedOpen(false)}
        >
          <div className="grid gap-3">
            <Labeled label="Date & time">
              <input
                type="datetime-local"
                value={schedAt}
                onChange={(e) => setSchedAt(e.target.value)}
                className="rounded-xl border px-3 py-2"
              />
            </Labeled>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Btn tone="ghost" onClick={() => setSchedOpen(false)}>
              Cancel
            </Btn>
            <Btn tone="primary" onClick={saveSchedule}>
              {schedBusy ? "Saving…" : "Save"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      <ConfirmModal
        open={approveOpen}
        busy={approveBusy}
        title="Approve this item?"
        confirmLabel="Approve & List"
        onCancel={() => setApproveOpen(false)}
        onConfirm={confirmApprove}
      >
        {approveTarget ? (
          <p>
            Set <strong>#{approveTarget.id}</strong> — “{approveTarget.title}”
            to <strong>listed</strong>? It will appear publicly in Search and on
            the home page.
          </p>
        ) : null}
      </ConfirmModal>

      {/* Toast outlet */}
      {toastNode}
    </div>
  );
}

/* ===================== Pretty UI bits ===================== */

function Header({
  role,
  onSignOut,
}: {
  role: string | null;
  onSignOut: () => void;
}) {
  return (
    <header
      className="w-full"
      style={{
        background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-white/80">
            Creek Lost & Found • moderation & insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs ring-1 ring-white/20">
              Signed in as <strong className="font-semibold">{role}</strong>
            </span>
          )}
          <button
            onClick={onSignOut}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium shadow hover:bg-white/90"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold">
      {children}
    </h2>
  );
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "amber" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  tint = "#f8fafc",
}: {
  label: string;
  value: number | string;
  tint?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      style={{ background: `linear-gradient(180deg, ${tint} 0%, white 60%)` }}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm shadow-sm transition ${
        active ? "text-white" : "text-gray-700 hover:bg-gray-50"
      }`}
      style={{
        borderColor: active ? "transparent" : "#e5e7eb",
        background: active
          ? `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`
          : "white",
      }}
    >
      {children}
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
      {text}
    </div>
  );
}

function RowInfo({
  title,
  meta,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{title}</div>
      {meta && (
        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
          {meta}
        </div>
      )}
    </div>
  );
}

function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 gap-2">{children}</div>;
}

function Btn({
  children,
  onClick,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    primary: `text-white shadow-sm`,
    secondary: `text-[${CREEK_NAVY}] bg-[${CREEK_SOFTN}] border border-[${CREEK_NAVY}]`,
    danger: `text-white shadow-sm`,
    ghost: `text-gray-700 border border-gray-200 bg-white hover:bg-gray-50`,
  };
  const background =
    tone === "primary"
      ? `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`
      : tone === "danger"
      ? `linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)`
      : "transparent";

  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${styles[tone]}`}
      style={{ background }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ItemStatusWidened }) {
  const look =
    status === "pending"
      ? "bg-amber-100 text-amber-800"
      : status === "listed"
      ? "bg-blue-100 text-blue-800"
      : status === "claimed"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-rose-100 text-rose-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${look}`}>
      {status}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[95%] max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div
            className="rounded-t-2xl px-4 py-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{title}</h3>
              <button
                className="text-sm text-white/90 hover:text-white"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      {children}
    </label>
  );
}

// ---------- Tiny thumb component ----------
function Thumb({ src, alt }: { src?: string; alt?: string }) {
  return (
    <div className="mr-3 h-12 w-16 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || FALLBACK_THUMB}
        alt={alt || ""}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
