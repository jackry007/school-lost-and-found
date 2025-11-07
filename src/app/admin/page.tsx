// src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Item, Claim } from "@/lib/types";
import { markClaimPickedUp } from "@/lib/claimsActions";
import { logEvent } from "@/lib/audit";

// --- NEW modular imports ---
import {
  BUCKET,
  CREEK_RED,
  CREEK_NAVY,
  CREEK_SOFTR,
  CREEK_SOFTN,
  FALLBACK_THUMB,
} from "@/lib/admin/constants";
import { useToasts } from "@/lib/admin/hooks/useToasts";
import { useBodyScrollLock } from "@/lib/admin/hooks/useBodyScrollLock";
import { Portal } from "@/lib/admin/Portal";
import {
  getUid,
  approveClaimRPC,
  requestInfoRPC,
  rejectClaimRPC,
  markReturnedRPC,
  getLatestClaimForItem,
} from "@/lib/admin/rpc";
import {
  computeClaimThumbs,
  computeVisibleItems,
  computeStats,
  type ItemStatusWidened,
} from "@/lib/admin/selectors";

/* =========================================================
   Types
   ======================================================= */
type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "on_hold"
  | "claimed"
  | "rejected"
  | "needs_info"
  | "expired"
  | "completed";

type ChatMessage = {
  id: number;
  claim_id: number;
  sender_uid: string;
  sender_role: "staff" | "claimant";
  body: string;
  created_at: string;
  seen_by_claimant: boolean | null;
  seen_by_staff: boolean | null;
};

type AuditRow = {
  id: number;
  at: string;
  actor_uid: string | null;
  action: string;
  entity_type: "item" | "claim" | "message";
  entity_id: number | null;
  details: any;
  user_agent?: string | null;
};

/* =========================================================
   Confirm Modal (for item approve)
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
  useBodyScrollLock(open);

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
    <Portal>
      <div className="fixed inset-0 z-[100]">
        <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
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
      </div>
    </Portal>
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

  // ----- Schedule modal -----
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedClaim, setSchedClaim] = useState<Claim | null>(null);
  const [schedAt, setSchedAt] = useState("");
  const [schedBusy, setSchedBusy] = useState(false);

  // ----- Chat modal -----
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClaim, setChatClaim] = useState<Claim | null>(null);

  // ----- Mark Returned / Picked Up -----
  const [pickupCode, setPickupCode] = useState("");
  const [markBusy, setMarkBusy] = useState(false);

  // ----- Activity Log -----
  const [logRows, setLogRows] = useState<AuditRow[]>([]);
  const [logLoading, setLogLoading] = useState(true);

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

  async function loadLog() {
    setLogLoading(true);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("at", { ascending: false })
      .limit(200);
    if (!error && data) setLogRows(data as AuditRow[]);
    setLogLoading(false);
  }

  useEffect(() => {
    load();
    loadLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime refresh when claims change
  useEffect(() => {
    const ch = supabase
      .channel("claims-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime activity log
  useEffect(() => {
    const ch = supabase
      .channel("audit-log-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        (payload) => {
          setLogRows((rows) =>
            [payload.new as AuditRow, ...rows].slice(0, 200)
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
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

  /* ---------------- Actions: auth ---------------- */
  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setItems([]);
    setClaims([]);
    router.replace("/");
  };

  // Opens the Edit modal prefilled with the item's current fields
  const openEdit = (it: Item) => {
    setEditItem(it);
    setEditForm({
      title: it.title ?? "",
      category: it.category ?? "",
      ...({ location: (it as any).location ?? "" } as any),
      description: it.description ?? "",
    });
    setEditOpen(true);
  };

  /* ---------------- Actions: ITEMS (moderation) ---------------- */
  const askApprove = (it: Item) => {
    setApproveTarget(it);
    setApproveOpen(true);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const id = approveTarget.id;
    setApproveBusy(true);

    // optimistic move
    moveItemLocally(id, "listed");
    setApproveOpen(false);
    setApproveBusy(false);

    // show undo toast
    addToast(`Approved: “${approveTarget.title}”`, {
      actionLabel: "Undo (5s)",
      ttl: 5000,
      onAction: async () => {
        await supabase.from("items").update({ status: "pending" }).eq("id", id);
        moveItemLocally(id, "pending");
        await logEvent("item_updated", "item", id, {
          prev_status: "listed",
          next_status: "pending",
          via: "undo",
        });
      },
    });

    // persist
    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);
    if (error) {
      moveItemLocally(id, "pending");
      addToast(`Error listing item: ${error.message}`);
    } else {
      await logEvent("item_listed", "item", id);
    }
  };

  const updateItemStatus = async (id: number, status: "rejected") => {
    const { error } = await supabase
      .from("items")
      .update({ status })
      .eq("id", id);
    if (error) return addToast(`Error: ${error.message}`);
    moveItemLocally(id, "rejected");
    addToast(`Item #${id} → rejected`);
    await logEvent("item_rejected", "item", id);
  };

  const restoreToListed = async (id: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);
    if (error) return addToast(`Error: ${error.message}`);
    moveItemLocally(id, "listed");
    addToast(`Item #${id} restored to Listed.`);
    await logEvent("item_released_hold", "item", id);
  };

  /* ---------------- Actions: CLAIMS ---------------- */
  async function onApproveClaim(c: Claim) {
    const uid = await getUid();
    if (!uid) return addToast("Not signed in.");
    try {
      const info = await approveClaimRPC(c.id, uid);
      if (info?.pickup_code) {
        addToast(`Claim #${c.id} approved. Code: ${info.pickup_code}`);
        try {
          await navigator.clipboard.writeText(info.pickup_code);
          addToast("Pickup code copied.");
        } catch {}
      } else {
        addToast(`Claim #${c.id} approved.`);
      }
      await logEvent("approve_claim", "claim", c.id, { item_id: c.item_id });
      load();
    } catch (e: any) {
      addToast(`Approve failed: ${e.message || e}`);
    }
  }

  async function onAskInfo(c: Claim) {
    const uid = await getUid();
    if (!uid) return addToast("Not signed in.");
    try {
      await requestInfoRPC(c.id, uid, "");
      addToast(`Asked for more info on Claim #${c.id}`);
      await logEvent("request_info", "claim", c.id);
      load();
    } catch (e: any) {
      addToast(`Request failed: ${e.message || e}`);
    }
  }

  async function onRejectClaim(c: Claim) {
    const uid = await getUid();
    if (!uid) return addToast("Not signed in.");
    try {
      await rejectClaimRPC(c.id, uid, "Not enough proof to verify ownership.");
      addToast(`Claim #${c.id} rejected.`);
      await logEvent("reject_claim", "claim", c.id);
      load();
    } catch (e: any) {
      addToast(`Reject failed: ${e.message || e}`);
    }
  }

  async function onMarkReturnedSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uid = await getUid();
    if (!uid) return addToast("Not signed in.");
    const code = pickupCode.trim().toUpperCase();
    if (!code) return;
    setMarkBusy(true);
    try {
      await markReturnedRPC(code, uid);
      addToast("Item marked returned.");
      await logEvent("mark_picked_up", "claim", null, { pickup_code: code });
      setPickupCode("");
      load();
    } catch (e: any) {
      addToast(e.message ?? "Invalid or already used code.");
    } finally {
      setMarkBusy(false);
    }
  }

  // One-click “Mark Picked Up”
  async function onQuickPickUp(itemId: number) {
    const uid = await getUid();
    if (!uid) return addToast("Not signed in.");
    setMarkBusy(true);
    try {
      const claim = await getLatestClaimForItem(itemId);
      if (!claim?.id) throw new Error("No claim found for this item.");

      await markClaimPickedUp(claim.id, uid);
      addToast(`Claim #${claim.id} marked picked up ✅`);
      await logEvent("mark_picked_up", "claim", claim.id, { item_id: itemId });
      await load();
    } catch (err: any) {
      addToast(err?.message ?? "Failed to mark picked up");
    } finally {
      setMarkBusy(false);
    }
  }

  // Manual desk button
  async function onMarkPickedUp() {
    const code = pickupCode.trim().toUpperCase();
    if (!code) return;
    const uid = await getUid();
    if (!uid) return addToast("Not signed in.");

    setMarkBusy(true);
    try {
      const { error } = await supabase.rpc("mark_claim_returned", {
        p_pickup_code: code,
        p_admin: uid,
      });
      if (error) throw error;

      addToast("Item marked as picked up!");
      await logEvent("mark_picked_up", "claim", null, { pickup_code: code });
      setPickupCode("");
      load();
    } catch (err: any) {
      addToast(err?.message ?? "Failed to mark as picked up");
    } finally {
      setMarkBusy(false);
    }
  }

  /* ---------------- Schedule + Chat helpers ---------------- */
  function openSchedule(c: Claim) {
    setSchedClaim(c);
    const at = (c as any).schedule_at as string | null | undefined;
    setSchedAt(at ? new Date(at).toISOString().slice(0, 16) : "");
    setSchedOpen(true);
  }

  function openChat(c: Claim) {
    setChatClaim(c);
    setChatOpen(true);
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

    await logEvent(
      iso ? "schedule_set" : "schedule_cleared",
      "claim",
      schedClaim.id,
      { at: iso }
    );

    setSchedOpen(false);
    setSchedClaim(null);
    load();
  }

  /* ---------------- Derived ---------------- */
  const pendingItems = items.filter(
    (i) => (i.status as ItemStatusWidened) === "pending"
  );
  const pendingClaims = claims.filter((c) => c.status === "pending");

  const claimThumbs = useMemo(
    () => computeClaimThumbs(claims, items, thumbMap),
    [claims, items, thumbMap]
  );

  const visibleItems = useMemo(
    () => computeVisibleItems(items, statusFilter, q),
    [items, statusFilter, q]
  );

  const {
    totalItems,
    totalClaims,
    listedCount,
    onHoldCount,
    returnedCount,
    pendingCount,
    rejectedCount,
    topCats,
    topLocs,
  } = useMemo(() => computeStats(items, claims), [items, claims]);

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
        {/* Quick Actions Row */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Pickup Desk:</span> Enter a pickup
              code to mark a claim as picked up.
            </div>
            <form className="flex gap-2" onSubmit={onMarkReturnedSubmit}>
              <input
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                placeholder="Pickup code"
                className="w-40 rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2"
              />
              <Btn
                tone="success"
                onClick={onMarkPickedUp}
                disabled={markBusy || pickupCode.trim().length < 4}
              >
                {markBusy ? "Marking…" : "Mark Picked Up"}
              </Btn>
            </form>
          </div>
        </Card>

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
            <StatCard label="On Hold" value={onHoldCount} tint="#fff7ee" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Pending" value={pendingCount} tint="#fff6e8" />
            <StatCard label="Rejected" value={rejectedCount} tint="#fdeff0" />
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

        {/* Activity Log */}
        <section className="space-y-3">
          <SectionHeading>Activity Log</SectionHeading>
          <Card>
            {logLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading…</div>
            ) : logRows.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-600">
                No activity yet.
              </div>
            ) : (
              <ul className="divide-y">
                {logRows.map((r) => (
                  <li
                    key={r.id}
                    className="p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-800">
                          {r.entity_type}
                          {r.entity_id ? `#${r.entity_id}` : ""}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-800">
                          {r.action}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-800 break-words">
                        {Object.keys(r.details ?? {}).length
                          ? JSON.stringify(r.details ?? {}, null, 0)
                          : "—"}
                      </div>
                      {r.actor_uid && (
                        <div className="mt-1 text-[11px] text-gray-500">
                          by {r.actor_uid}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-gray-500">
                      {new Date(r.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
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
                          {(c as any).claimant_name} (
                          {(c as any).claimant_email})
                          {(c as any).proof && (
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

                    <Btn tone="ghost" onClick={() => openChat(c)}>
                      Message
                    </Btn>

                    <Btn tone="ghost" onClick={() => openSchedule(c)}>
                      {schedChip ? "Reschedule" : "Schedule"}
                    </Btn>

                    <Btn tone="primary" onClick={() => onApproveClaim(c)}>
                      Approve
                    </Btn>
                    <Btn tone="ghost" onClick={() => onAskInfo(c)}>
                      Ask Info
                    </Btn>
                    <Btn tone="danger" onClick={() => onRejectClaim(c)}>
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
                  "on_hold",
                  "claimed",
                  "rejected",
                ] as StatusFilter[]
              ).map((sf) => (
                <Pill
                  key={sf}
                  active={statusFilter === sf}
                  onClick={() => setStatusFilter(sf)}
                >
                  {sf
                    .replace("_", " ")
                    .replace(/\b\w/g, (m) => m.toUpperCase())}
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
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                      </>
                    )}
                    {s === "on_hold" && (
                      <>
                        <span className="mr-1 text-xs text-gray-500">
                          Awaiting pickup…
                        </span>
                        <Btn
                          tone="success"
                          onClick={() => onQuickPickUp(it.id)}
                          disabled={markBusy}
                        >
                          {markBusy ? "Working…" : "Mark Picked Up"}
                        </Btn>
                        <Btn
                          tone="secondary"
                          onClick={() => restoreToListed(it.id)}
                          disabled={markBusy}
                        >
                          Release Hold
                        </Btn>
                      </>
                    )}
                    {s === "claimed" && (
                      <span className="text-xs text-emerald-700">
                        Picked Up 🎉
                      </span>
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
            <Btn
              tone="primary"
              onClick={async () => {
                if (!editItem) return;
                const payload: Partial<Item> = {
                  title: editForm.title ?? editItem.title,
                  category: editForm.category ?? editItem.category,
                  // @ts-expect-error ensure your table column is "location"
                  location:
                    (editForm as any).location ??
                    (editItem as any).location ??
                    null,
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
                await logEvent(
                  "item_updated",
                  "item",
                  editItem.id,
                  payload as any
                );
              }}
            >
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

      {/* Schedule Modal */}
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

      {/* Approve Item Modal */}
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

      {/* Chat Modal */}
      {chatOpen && chatClaim && (
        <ChatModal
          claim={chatClaim}
          meIsStaff={true}
          onClose={() => {
            setChatOpen(false);
            setChatClaim(null);
          }}
        />
      )}

      {/* Toast outlet */}
      {toastNode}
    </div>
  );
}

/* ===================== Pretty UI bits ===================== */

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
          <p className="text-sm text白/80">
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
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium shadow hover:bg白/90"
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
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "danger" | "ghost" | "success";
  disabled?: boolean;
}) {
  const base = "rounded-full px-3 py-1.5 text-sm";
  if (tone === "primary") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white shadow-sm disabled:opacity-60`}
        style={{
          background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
        }}
      >
        {children}
      </button>
    );
  }
  if (tone === "danger") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white shadow-sm disabled:opacity-60`}
        style={{
          background: "linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)",
        }}
      >
        {children}
      </button>
    );
  }
  if (tone === "success") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white shadow-sm disabled:opacity-60`}
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
        }}
      >
        {children}
      </button>
    );
  }
  if (tone === "secondary") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} border text-[13px] disabled:opacity-60`}
        style={{
          color: CREEK_NAVY,
          borderColor: CREEK_NAVY,
          background: CREEK_SOFTN,
        }}
      >
        {children}
      </button>
    );
  }
  // ghost
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ItemStatusWidened }) {
  const look =
    status === "claimed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "on_hold"
      ? "bg-amber-100 text-amber-800"
      : status === "listed"
      ? "bg-green-100 text-green-800"
      : status === "pending"
      ? "bg-amber-100 text-amber-800"
      : status === "rejected"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-800";

  const label =
    status === "claimed"
      ? "Picked Up"
      : status === "on_hold"
      ? "On Hold"
      : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${look}`}>
      {label}
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
  useBodyScrollLock(true);
  return (
    <Portal>
      <div className="fixed inset-0 z-[100]">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
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
      </div>
    </Portal>
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

/* =========================================================
   Chat Modal (per-claim chat)
   ======================================================= */
function ChatModal({
  claim,
  meIsStaff,
  onClose,
}: {
  claim: Claim;
  meIsStaff: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(true);

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [myUid, setMyUid] = useState<string | null>(null);

  // load current user + messages
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMyUid(u.user?.id ?? null);

      const { data } = await supabase
        .from("claim_messages")
        .select("*")
        .eq("claim_id", claim.id)
        .order("created_at", { ascending: true });

      setMsgs((data as ChatMessage[]) || []);

      // mark seen (staff side)
      await supabase
        .from("claim_messages")
        .update({ seen_by_staff: true })
        .eq("claim_id", claim.id)
        .neq("sender_uid", u.user?.id ?? "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.id]);

  // realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`claim_messages:claim:${claim.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "claim_messages",
          filter: `claim_id=eq.${claim.id}`,
        },
        (payload) => {
          setMsgs((m) => [...m, payload.new as ChatMessage]);
          if (meIsStaff) {
            const row = payload.new as ChatMessage;
            if (row.sender_uid !== myUid) {
              supabase
                .from("claim_messages")
                .update({ seen_by_staff: true })
                .eq("id", row.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claim.id, meIsStaff, myUid]);

  // autoscroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs.length]);

  async function send() {
    const text = input.trim();
    if (!text || !myUid) return;
    setBusy(true);

    const optimistic: ChatMessage = {
      id: Date.now(),
      claim_id: claim.id,
      sender_uid: myUid,
      sender_role: meIsStaff ? "staff" : "claimant",
      body: text,
      created_at: new Date().toISOString(),
      seen_by_claimant: meIsStaff ? false : true,
      seen_by_staff: meIsStaff ? true : false,
    };
    setMsgs((m) => [...m, optimistic]);
    setInput("");

    const { data, error } = await supabase
      .from("claim_messages")
      .insert({
        claim_id: claim.id,
        sender_uid: myUid,
        sender_role: meIsStaff ? "staff" : "claimant",
        body: text,
        seen_by_claimant: meIsStaff ? false : true,
        seen_by_staff: meIsStaff ? true : false,
      })
      .select("id")
      .single();

    if (error) {
      setMsgs((m) => m.filter((x) => x.id !== optimistic.id));
      alert(`Send failed: ${error.message}`);
      setInput(text);
      setBusy(false);
      return;
    }

    await logEvent("message_sent", "message", data?.id ?? null, {
      claim_id: claim.id,
    });

    setBusy(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[100]">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="flex w-[95%] max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div
                className="flex items-center justify-between px-4 py-3 text-white"
                style={{
                  background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
                }}
              >
                <div className="text-sm">
                  <div className="font-semibold">Claim #{claim.id}</div>
                  <div className="text-white/80">
                    {(claim as any).claimant_name} (
                    {(claim as any).claimant_email})
                  </div>
                </div>
                <button
                  className="rounded px-3 py-1 text-sm text-white hover:bg-white/10"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>

              {/* messages */}
              <div
                ref={listRef}
                className="max-h-[60vh] min-h-[40vh] overflow-y-auto bg-gray-50 p-4"
              >
                {msgs.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    No messages yet. Say hi 👋
                  </div>
                )}
                <div className="space-y-2">
                  {msgs.map((m) => {
                    const mine = m.sender_uid === myUid;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-800 border border-gray-200"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{m.body}</div>
                          <div
                            className={`mt-1 text-[10px] ${
                              mine ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* composer */}
              <div className="border-t border-gray-200 p-3">
                <textarea
                  className="h-20 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={busy}
                />
                <div className="mt-2 flex items-center justify-end">
                  <button
                    onClick={send}
                    disabled={busy || input.trim().length === 0}
                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow disabled:opacity-60"
                  >
                    {busy ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
