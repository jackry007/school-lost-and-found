"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Item, Claim } from "@/lib/types";
import { markClaimPickedUp } from "@/lib/claimsActions";
import { logEvent } from "@/lib/audit";

import { BUCKET, FALLBACK_THUMB } from "@/lib/admin/constants";
import { useToasts } from "@/lib/admin/hooks/useToasts";
import { Header } from "@/lib/admin/components";

// Modals
import { ChatModal } from "@/lib/admin/components/modals/ChatModal";
import { ConfirmModal } from "@/lib/admin/components/modals/ConfirmModal";

// RPC & selectors
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

/* ===== Extracted UI ===== */
import AdminTabs, { type AdminTab } from "@/components/admin/AdminTabs";
import OverviewSection from "@/components/admin/OverviewSection";
import QueuesSection from "@/components/admin/QueuesSection";
import ActivitySection from "@/components/admin/ActivitySection";

import EditItemModal, {
  type EditItemForm,
} from "@/components/admin/modals/EditItemModal";
import ApproveItemConfirmModal from "@/components/admin/modals/ApproveItemConfirmModal";
import PhotoLightboxModal from "@/components/admin/modals/PhotoLightboxModal";

/* ✅ shared type */
import type { StatusFilter } from "@/components/admin/types";

/* =========================================================
   Types
   ======================================================= */
type AuditRow = {
  id: number;
  at?: string;
  occurred_at?: string;
  actor_uid: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: "item" | "claim" | "message";
  entity_id: number | null;
  details: any;
  user_agent?: string | null;
};

type ConfirmState =
  | { type: "reject-item"; item: Item }
  | { type: "approve-claim"; claim: Claim }
  | { type: "reject-claim"; claim: Claim }
  | { type: "mark-picked-up"; claim: Claim }
  | null;

/* =========================================================
   Page
   ======================================================= */
export default function AdminPage() {
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "staff" | "user" | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // filters / search
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [q, setQ] = useState("");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<EditItemForm>({});
  const [editSaving, setEditSaving] = useState(false);

  // Approve item confirm
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveBusy, setApproveBusy] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Item | null>(null);

  // Generic confirm modal
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Photo lightbox
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoCategory, setPhotoCategory] = useState<string | undefined>();
  const [photoLocation, setPhotoLocation] = useState<string | undefined>();
  const [photoDescription, setPhotoDescription] = useState<
    string | undefined
  >();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Chat modal
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClaim, setChatClaim] = useState<Claim | null>(null);

  // Picked up / returned
  const [pickupCode, setPickupCode] = useState("");
  const [markBusy, setMarkBusy] = useState(false);

  // Activity
  const [logRows, setLogRows] = useState<AuditRow[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logLoadedOnce, setLogLoadedOnce] = useState(false);
  const [logHasMore, setLogHasMore] = useState(true);
  const PAGE_SIZE = 100;

  const [tab, setTab] = useState<AdminTab>("Overview");

  // toasts
  const { add: addToast, node: toastNode } = useToasts();

  // thumbnails cache: item.id -> public url
  const [thumbMap, setThumbMap] = useState<Record<number, string>>({});

  function openPhotos({
    title,
    urls,
    category,
    location,
    description,
  }: {
    title: string;
    urls: string[];
    category?: string;
    location?: string;
    description?: string;
  }) {
    setPhotoTitle(title);
    setPhotoUrls(urls);
    setPhotoCategory(category);
    setPhotoLocation(location);
    setPhotoDescription(description);
    setPhotoOpen(true);
  }

  /* ---------------- Auth + load ---------------- */
  const load = async () => {
    setLoading(true);

    try {
      const { data: sessionRes, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) throw sessionErr;

      const uid = sessionRes.session?.user?.id;
      if (!uid) {
        router.replace("/auth/login");
        return;
      }

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("uid", uid)
        .single();

      if (profErr) throw profErr;

      if (!prof || !["admin", "staff"].includes(prof.role)) {
        alert("Not authorized");
        router.replace("/");
        return;
      }

      setRole(prof.role as "admin" | "staff");

      const [{ data: its, error: itemsErr }, { data: cls, error: claimsErr }] =
        await Promise.all([
          supabase
            .from("items")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("claims")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (itemsErr) throw itemsErr;
      if (claimsErr) throw claimsErr;

      setItems((its as Item[]) || []);
      setClaims((cls as Claim[]) || []);
    } catch (err) {
      console.error("Admin load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  async function loadActivity({ reset = false }: { reset?: boolean } = {}) {
    setLogLoading(true);

    const start = reset ? 0 : logRows.length;
    const end = start + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("v_activity_unified")
      .select("*")
      .order("occurred_at", { ascending: false })
      .range(start, end);

    if (error) {
      console.error("activity fetch failed:", error);
      setLogLoading(false);
      setLogLoadedOnce(true);
      return;
    }

    setLogRows((prev) => (reset ? (data ?? []) : [...prev, ...(data ?? [])]));
    setLogHasMore((data?.length ?? 0) === PAGE_SIZE);
    setLogLoading(false);
    setLogLoadedOnce(true);
  }

  async function loadMoreActivity() {
    if (!logHasMore || logLoading) return;
    await loadActivity({ reset: false });
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "Activity" && !logLoadedOnce) {
      void loadActivity({ reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, logLoadedOnce]);

  // realtime refresh when claims change
  useEffect(() => {
    const ch = supabase
      .channel("claims-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime activity log (subscribe only when Activity is open)
  useEffect(() => {
    if (tab !== "Activity") return;

    const ch = supabase
      .channel("audit-log-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        (payload) => {
          setLogRows((rows) =>
            [payload.new as AuditRow, ...rows].slice(0, 200),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [tab]);

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
      prev.map((it) => (it.id === id ? ({ ...it, status } as Item) : it)),
    );
  }

  async function onCopyPickupCode(code?: string | null) {
    if (!code) {
      addToast("No pickup code found.");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      addToast(`Pickup code copied: ${code}`);
    } catch {
      addToast(`Pickup code: ${code}`);
    }
  }

  /* ---------------- Actions: auth ---------------- */
  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setItems([]);
    setClaims([]);
    router.replace("/");
  };

  /* ---------------- Actions: edit ---------------- */
  const openEdit = (it: Item) => {
    setEditItem(it);
    setEditForm({
      title: it.title ?? "",
      category: it.category ?? "",
      location: (it as any).location ?? "",
      description: it.description ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);

    const payload: Partial<Item> = {
      title: editForm.title ?? editItem.title,
      category: editForm.category ?? editItem.category,
      // @ts-expect-error column is "location"
      location:
        (editForm as any).location ?? (editItem as any).location ?? null,
      description: editForm.description ?? editItem.description,
    };

    const { error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", editItem.id);

    setEditSaving(false);

    if (error) {
      addToast(`Save failed: ${error.message}`);
      return;
    }

    setEditOpen(false);
    setEditItem(null);
    setEditForm({});

    setItems((prev) =>
      prev.map((it) =>
        it.id === editItem.id ? ({ ...it, ...payload } as Item) : it,
      ),
    );

    addToast("Changes saved.");
    await logEvent("item_updated", "item", editItem.id, payload as any);
  };

  /* ---------------- Actions: ITEMS ---------------- */
  const askApprove = (it: Item) => {
    setApproveTarget(it);
    setApproveOpen(true);
  };

  function askMarkPickedUp(c: Claim) {
    setConfirmState({ type: "mark-picked-up", claim: c });
  }

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const id = approveTarget.id;

    setApproveBusy(true);

    // optimistic move
    moveItemLocally(id, "listed");
    setApproveOpen(false);
    setApproveBusy(false);

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

    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);

    if (error) {
      moveItemLocally(id, "pending");
      addToast(`Error listing item: ${error.message}`);
      return;
    }

    await logEvent("item_listed", "item", id);
  };

  const updateItemStatus = async (id: number, status: "rejected") => {
    const { error } = await supabase
      .from("items")
      .update({ status })
      .eq("id", id);

    if (error) {
      addToast(`Error: ${error.message}`);
      return;
    }

    moveItemLocally(id, "rejected");
    addToast(`Item #${id} → rejected`);
    await logEvent("item_rejected", "item", id);
  };

  const restoreToListed = async (id: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);

    if (error) {
      addToast(`Error: ${error.message}`);
      return;
    }

    moveItemLocally(id, "listed");
    addToast(`Item #${id} restored to Listed.`);
    await logEvent("item_released_hold", "item", id);
  };

  /* ---------------- Actions: CLAIMS ---------------- */
  async function onApproveClaim(c: Claim) {
    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

    try {
      const info = await approveClaimRPC(c.id, uid);
      const pickupCode = info?.pickup_code ?? null;

      const autoMsg = pickupCode
        ? `Your claim has been approved. Please come to the office to pick up your item. Be sure to bring proof of ownership. Your pickup code is: ${pickupCode}.`
        : `Your claim has been approved. Please come to the office to pick up your item. Be sure to bring proof of ownership.`;

      const { error: msgError } = await supabase.from("claim_messages").insert({
        claim_id: c.id,
        sender_uid: uid,
        sender_role: "staff",
        body: autoMsg,
        seen_by_claimant: false,
        seen_by_staff: true,
      });

      if (msgError) {
        console.error("Auto message failed:", msgError);
      }

      if (pickupCode) {
        addToast(`Claim #${c.id} approved. Code: ${pickupCode}`);
        try {
          await navigator.clipboard.writeText(pickupCode);
          addToast("Pickup code copied.");
        } catch {
          // ignore clipboard failures
        }
      } else {
        addToast(`Claim #${c.id} approved.`);
      }

      await logEvent("approve_claim", "claim", c.id, {
        item_id: c.item_id,
        pickup_code: pickupCode,
        auto_message_sent: !msgError,
      });

      await load();
    } catch (e: any) {
      addToast(`Approve failed: ${e.message || e}`);
    }
  }

  async function onAskInfo(c: Claim) {
    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

    try {
      await requestInfoRPC(c.id, uid, "");
      addToast(`Asked for more info on Claim #${c.id}`);
      await logEvent("request_info", "claim", c.id);
      await load();
    } catch (e: any) {
      addToast(`Request failed: ${e.message || e}`);
    }
  }

  async function onRejectClaim(c: Claim) {
    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

    try {
      await rejectClaimRPC(c.id, uid, "Not enough proof to verify ownership.");
      addToast(`Claim #${c.id} rejected.`);
      await logEvent("reject_claim", "claim", c.id);
      await load();
    } catch (e: any) {
      addToast(`Reject failed: ${e.message || e}`);
    }
  }

  async function onMarkReturnedSubmit(e: React.FormEvent) {
    e.preventDefault();

    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

    const code = pickupCode.trim().toUpperCase();
    if (!code) return;

    setMarkBusy(true);
    try {
      await markReturnedRPC(code, uid);
      addToast("Item marked returned.");
      await logEvent("mark_picked_up", "claim", null, { pickup_code: code });
      setPickupCode("");
      await load();
    } catch (e: any) {
      addToast(e.message ?? "Invalid or already used code.");
    } finally {
      setMarkBusy(false);
    }
  }

  async function onQuickPickUp(itemId: number) {
    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

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

  async function onMarkPickedUpClaim(c: Claim) {
    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

    setMarkBusy(true);
    try {
      await markClaimPickedUp(c.id, uid);
      addToast(`Claim #${c.id} marked picked up ✅`);
      await logEvent("mark_picked_up", "claim", c.id, { item_id: c.item_id });
      await load();
    } catch (err: any) {
      addToast(err?.message ?? "Failed to mark picked up");
    } finally {
      setMarkBusy(false);
    }
  }

  async function onMarkPickedUp() {
    const code = pickupCode.trim().toUpperCase();
    if (!code) return;

    const uid = await getUid();
    if (!uid) {
      addToast("Not signed in.");
      return;
    }

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
      await load();
    } catch (err: any) {
      addToast(err?.message ?? "Failed to mark as picked up");
    } finally {
      setMarkBusy(false);
    }
  }

  /* ---------------- Confirm helpers ---------------- */
  function askRejectItem(it: Item) {
    setConfirmState({ type: "reject-item", item: it });
  }

  function askApproveClaim(c: Claim) {
    setConfirmState({ type: "approve-claim", claim: c });
  }

  function askRejectClaim(c: Claim) {
    setConfirmState({ type: "reject-claim", claim: c });
  }

  async function handleConfirmAction() {
    if (!confirmState || confirmBusy) return;

    setConfirmBusy(true);

    try {
      if (confirmState.type === "reject-item") {
        await updateItemStatus(confirmState.item.id, "rejected");
      } else if (confirmState.type === "approve-claim") {
        await onApproveClaim(confirmState.claim);
      } else if (confirmState.type === "reject-claim") {
        await onRejectClaim(confirmState.claim);
      } else if (confirmState.type === "mark-picked-up") {
        await onMarkPickedUpClaim(confirmState.claim);
      }

      setConfirmState(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  /* ---------------- Chat helpers ---------------- */
  function openChat(c: Claim) {
    setChatClaim(c);
    setChatOpen(true);
  }

  /* ---------------- Derived ---------------- */
  const pendingItems = items.filter(
    (i) => (i.status as ItemStatusWidened) === "pending",
  );
  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");

  const claimThumbs = useMemo(
    () => computeClaimThumbs(claims, items, thumbMap),
    [claims, items, thumbMap],
  );

  const visibleItems = useMemo(
    () => computeVisibleItems(items, statusFilter, q),
    [items, statusFilter, q],
  );

  const {
    totalItems,
    totalClaims,
    listedCount,
    onHoldCount,
    pendingCount,
    rejectedCount,
    topCats,
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

      <main className="mx-auto max-w-6xl p-6">
        <AdminTabs tab={tab} setTab={setTab} />

        {tab === "Overview" && (
          <OverviewSection
            items={items}
            totalItems={totalItems}
            totalClaims={totalClaims}
            listedCount={listedCount}
            onHoldCount={onHoldCount}
            pendingCount={pendingCount}
            rejectedCount={rejectedCount}
            topCats={topCats}
            pendingItems={pendingItems}
            pendingClaims={pendingClaims}
            approvedClaims={approvedClaims}
            thumbMap={thumbMap}
            claimThumbs={claimThumbs}
            logLoadedOnce={logLoadedOnce}
            logLoading={logLoading}
            logRows={logRows}
            onViewAllQueues={() => setTab("Queues")}
            onOpenActivityTab={() => setTab("Activity")}
            onAskApproveItem={askApprove}
            onAskRejectItem={askRejectItem}
            onEditItem={openEdit}
            onOpenPhotos={openPhotos}
            onOpenChat={openChat}
            onAskApproveClaim={askApproveClaim}
            onAskRejectClaim={askRejectClaim}
            onMarkPickedUpClaim={askMarkPickedUp}
            onCopyPickupCode={onCopyPickupCode}
            markBusy={markBusy}
          />
        )}

        {tab === "Queues" && (
          <QueuesSection
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            q={q}
            setQ={setQ}
            visibleItems={visibleItems}
            thumbMap={thumbMap}
            markBusy={markBusy}
            onAskApproveItem={askApprove}
            onRejectItem={(id) => updateItemStatus(id, "rejected")}
            onEditItem={openEdit}
            onQuickPickUp={onQuickPickUp}
            onRestoreToListed={restoreToListed}
          />
        )}

        {tab === "Activity" && (
          <ActivitySection
            logRows={logRows}
            logLoading={logLoading}
            logLoadedOnce={logLoadedOnce}
            logHasMore={logHasMore}
            onLoadMore={loadMoreActivity}
          />
        )}
      </main>

      {/* --- Modals --- */}
      <EditItemModal
        open={editOpen}
        item={editItem}
        form={editForm}
        setForm={setEditForm}
        saving={editSaving}
        onClose={() => setEditOpen(false)}
        onSave={saveEdit}
      />

      <PhotoLightboxModal
        open={photoOpen}
        title={photoTitle}
        category={photoCategory}
        location={photoLocation}
        description={photoDescription}
        urls={photoUrls}
        onClose={() => setPhotoOpen(false)}
      />

      <ApproveItemConfirmModal
        open={approveOpen}
        busy={approveBusy}
        target={approveTarget}
        onCancel={() => setApproveOpen(false)}
        onConfirm={confirmApprove}
      />

      <ConfirmModal
        open={!!confirmState}
        busy={confirmBusy}
        title={
          confirmState?.type === "reject-item"
            ? "Reject item?"
            : confirmState?.type === "approve-claim"
              ? "Approve claim?"
              : confirmState?.type === "reject-claim"
                ? "Reject claim?"
                : confirmState?.type === "mark-picked-up"
                  ? "Confirm pickup?"
                  : "Confirm action"
        }
        confirmLabel={
          confirmState?.type === "approve-claim"
            ? "Approve"
            : confirmState?.type === "mark-picked-up"
              ? "Mark Picked Up"
              : "Reject"
        }
        cancelLabel="Cancel"
        onCancel={() => {
          if (!confirmBusy) setConfirmState(null);
        }}
        onConfirm={handleConfirmAction}
      >
        {confirmState?.type === "reject-item" && (
          <>
            Are you sure you want to reject{" "}
            <span className="font-semibold">
              #{confirmState.item.id} · {confirmState.item.title}
            </span>
            ?
          </>
        )}

        {confirmState?.type === "approve-claim" && (
          <>
            Are you sure you want to approve claim{" "}
            <span className="font-semibold">#{confirmState.claim.id}</span>?
          </>
        )}

        {confirmState?.type === "reject-claim" && (
          <>
            Are you sure you want to reject claim{" "}
            <span className="font-semibold">#{confirmState.claim.id}</span>?
          </>
        )}

        {confirmState?.type === "mark-picked-up" && (
          <>
            Confirm that claim{" "}
            <span className="font-semibold">#{confirmState.claim.id}</span> has
            picked up the item?
          </>
        )}
      </ConfirmModal>

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
