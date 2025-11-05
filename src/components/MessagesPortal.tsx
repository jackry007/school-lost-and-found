"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatModal, { type ChatClaim } from "./ChatModal";

type ProfileRole = "admin" | "staff" | "user";

type ClaimMessage = {
  id: number;
  claim_id: number;
  sender_uid: string;
  sender_role: "claimant" | "staff" | "student";
  body: string;
  created_at: string;
  seen_by_claimant: boolean | null;
  seen_by_staff: boolean | null;
};

/* ---------- UI helpers ---------- */
function initialsFrom(name?: string | null, email?: string | null) {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
  }
  const e = (email ?? "").trim();
  return e ? e[0].toUpperCase() : "U";
}
// keep near top of MessagesPortal.tsx
function statusPillClasses(s?: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "pending") return "bg-amber-100 text-amber-800";
  if (v === "approved") return "bg-emerald-100 text-emerald-800";
  if (v === "rejected") return "bg-rose-100 text-rose-800";
  if (v === "claimed") return "bg-violet-100 text-violet-800";
  if (v === "listed") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(diff / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 6) return new Date(iso).toLocaleDateString();
  if (d >= 1) return `${d}d`;
  if (h >= 1) return `${h}h`;
  if (m >= 1) return `${m}m`;
  return `${s}s`;
}
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function MessagesPortal() {
  const [uid, setUid] = useState<string>("");
  const [role, setRole] = useState<ProfileRole | null>(null);

  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ChatClaim[]>([]);
  const [threadsById, setThreadsById] = useState<Record<number, ChatClaim>>({});
  const [lastByClaim, setLastByClaim] = useState<Record<number, string>>({});
  const [lastTimeByClaim, setLastTimeByClaim] = useState<
    Record<number, string>
  >({});
  const [unreadByClaim, setUnreadByClaim] = useState<Record<number, number>>(
    {}
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClaim, setChatClaim] = useState<ChatClaim | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 200);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sort, setSort] = useState<"new" | "old" | "unread">("new");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Refs (for outside-click, focus mgmt, list scroll)
  const launcherRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const meIsStaff = role === "admin" || role === "staff";

  /* ---------- auth + role ---------- */
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const id = u.user?.id ?? "";
      setUid(id);
      if (!id) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("uid", id)
        .single();
      setRole((prof?.role as ProfileRole) ?? "user");
    })();
  }, []);

  /* ---------- load threads + preview/unread ---------- */
  useEffect(() => {
    if (!uid || !role) return;
    let alive = true;

    (async () => {
      let q = supabase
        .from("claims")
        .select(
          "id,item_id,claimant_name,claimant_email,status,created_at,claimant_uid"
        )
        .order("created_at", { ascending: false });

      if (!meIsStaff) q = q.eq("claimant_uid", uid);

      const { data: cl, error } = await q;
      if (error || !cl || !alive) return;

      const claims = cl as ChatClaim[];
      setThreads(claims.slice(0, 300));

      const byId: Record<number, ChatClaim> = {};
      for (const c of claims) byId[Number(c.id)] = c;
      setThreadsById(byId);

      const ids = claims.map((c) => Number(c.id));
      if (ids.length === 0) {
        setLastByClaim({});
        setUnreadByClaim({});
        setLastTimeByClaim({});
        return;
      }

      const { data: msgs } = await supabase
        .from("claim_messages")
        .select(
          "id,claim_id,body,created_at,seen_by_claimant,seen_by_staff,sender_role"
        )
        .in("claim_id", ids)
        .order("created_at", { ascending: false });

      const last: Record<number, string> = {};
      const lastT: Record<number, string> = {};
      const unread: Record<number, number> = {};

      (msgs || []).forEach((mr) => {
        const m = mr as ClaimMessage;
        const cid = Number(m.claim_id);
        if (!last[cid]) {
          last[cid] = m.body;
          lastT[cid] = m.created_at;
        }
        const addressedToStaff =
          m.sender_role === "claimant" || m.sender_role === "student";
        const isUnreadForMe = meIsStaff
          ? addressedToStaff && !m.seen_by_staff
          : m.sender_role === "staff" && !m.seen_by_claimant;
        if (isUnreadForMe) unread[cid] = (unread[cid] || 0) + 1;
      });

      setLastByClaim(last);
      setLastTimeByClaim(lastT);
      setUnreadByClaim(unread);
    })();

    return () => {
      alive = false;
    };
  }, [uid, role, meIsStaff]);

  /* ---------- realtime preview/unread ---------- */
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel("claim_msg_portal_rx")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "claim_messages" },
        (payload) => {
          const m = payload.new as ClaimMessage;
          const cid = Number(m.claim_id);
          setLastByClaim((p) => ({ ...p, [cid]: m.body }));
          setLastTimeByClaim((p) => ({ ...p, [cid]: m.created_at }));

          const mine = m.sender_uid === uid;
          const addressedToStaff =
            m.sender_role === "claimant" || m.sender_role === "student";
          const addressedToMe = meIsStaff
            ? addressedToStaff
            : m.sender_role === "staff";
          if (!mine && addressedToMe) {
            setUnreadByClaim((p) => ({ ...p, [cid]: (p[cid] || 0) + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, meIsStaff]);

  /* ---------- mark seen helper ---------- */
  const markSeen = useCallback(
    async (claimId: number) => {
      const field = meIsStaff ? "seen_by_staff" : "seen_by_claimant";
      await supabase
        .from("claim_messages")
        .update({ [field]: true })
        .eq("claim_id", claimId)
        .eq(field, false);
    },
    [meIsStaff]
  );

  function openThread(c: ChatClaim) {
    setChatClaim(c);
    setChatOpen(true);
    setUnreadByClaim((p) => ({ ...p, [Number(c.id)]: 0 }));
    markSeen(Number(c.id));
    setOpen(false);
  }

  const openThreadById = useCallback(
    async (claimId: number) => {
      const cached = threadsById[claimId];
      if (cached) return openThread(cached);

      let q = supabase
        .from("claims")
        .select(
          "id,item_id,claimant_name,claimant_email,status,created_at,claimant_uid"
        )
        .eq("id", claimId)
        .limit(1);

      if (!meIsStaff) q = q.eq("claimant_uid", uid);

      const { data } = await q;
      if (data && data[0]) openThread(data[0] as ChatClaim);
    },
    [threadsById, uid, meIsStaff]
  );

  /* ---------- deep-links + event bus ---------- */
  useEffect(() => {
    const url =
      typeof window !== "undefined" ? new URL(window.location.href) : null;
    if (!url || !uid || !role) return;
    const qOpen = url.searchParams.get("openClaim");
    const qChat = url.searchParams.get("chat");
    if (qOpen) {
      const cid = Number(qOpen);
      if (!Number.isNaN(cid)) {
        setOpen(true);
        openThreadById(cid);
      }
    } else if (qChat === "1") {
      const m = url.pathname.match(/\/claim\/(\d+)(?:\/|$)/);
      if (m) {
        const cid = Number(m[1]);
        if (!Number.isNaN(cid)) {
          setOpen(true);
          openThreadById(cid);
        }
      }
    }
  }, [uid, role, openThreadById]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as { claimId?: number | string };
      const cid = Number(d?.claimId);
      if (!Number.isNaN(cid)) {
        setOpen(true);
        openThreadById(cid);
      }
    };
    window.addEventListener("cc:open-claim", onOpen as EventListener);
    return () =>
      window.removeEventListener("cc:open-claim", onOpen as EventListener);
  }, [openThreadById]);

  /* ---------- click outside to close ---------- */
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (portalRef.current?.contains(target)) return;
      if (launcherRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  /* ---------- keyboard nav ---------- */
  const filteredThreads = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    let arr = threads.filter((t) => {
      if (
        statusFilter !== "all" &&
        (t.status || "").toLowerCase() !== statusFilter
      )
        return false;
      if (showUnreadOnly && !unreadByClaim[Number(t.id)]) return false;

      if (!q) return true;
      const left = [
        `#${t.id}`,
        t.claimant_name || "",
        t.claimant_email || "",
        String(t.item_id || ""),
        t.status || "",
      ]
        .join(" ")
        .toLowerCase();
      return left.includes(q);
    });

    arr.sort((a, b) => {
      const aid = Number(a.id);
      const bid = Number(b.id);
      const at = lastTimeByClaim[aid] || a.created_at;
      const bt = lastTimeByClaim[bid] || b.created_at;
      if (sort === "unread") {
        const ua = unreadByClaim[aid] ? 1 : 0;
        const ub = unreadByClaim[bid] ? 1 : 0;
        if (ub !== ua) return ub - ua;
        return (bt ? +new Date(bt) : 0) - (at ? +new Date(at) : 0);
      }
      if (sort === "old") {
        return (at ? +new Date(at) : 0) - (bt ? +new Date(bt) : 0);
      }
      return (bt ? +new Date(bt) : 0) - (at ? +new Date(at) : 0);
    });

    return arr;
  }, [
    threads,
    debouncedSearch,
    statusFilter,
    showUnreadOnly,
    sort,
    unreadByClaim,
    lastTimeByClaim,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!filteredThreads.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filteredThreads.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        if (activeIndex >= 0) openThread(filteredThreads[activeIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filteredThreads, activeIndex]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelectorAll("li")[
      activeIndex
    ] as HTMLLIElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  /* ---------- scoped globals for portal readability on dark header ---------- */
  const globalCSS = `
    .messages-portal select,
    .messages-portal input,
    .messages-portal textarea { color:#111 !important; background:#fff !important; }
    .messages-portal input::placeholder { color:#6b7280 !important; }
    .messages-portal .avatar { background:linear-gradient(135deg,#f3f4f6,#e5e7eb); }
  `;

  /* ---------- UI ---------- */
  return (
    <>
      <style jsx global>
        {globalCSS}
      </style>

      <div className="relative">
        {/* Launcher */}
        <button
          ref={launcherRef}
          onClick={() => {
            setOpen((o) => !o);
            setActiveIndex(-1);
          }}
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
            "border border-white/30 bg-white/10 hover:bg-white/20 text-white",
            "focus:outline-none focus:ring-2 focus:ring-white/60 transition",
          ].join(" ")}
          title="Messages"
        >
          Messages
          {Object.values(unreadByClaim).reduce((a, b) => a + b, 0) > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
              {Object.values(unreadByClaim).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>

        {open && (
          <div
            ref={portalRef}
            className="messages-portal fixed right-4 top-16 z-[70] w-[420px] max-w-[92vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  Inbox
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                  {threads.length}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {/* Toolbar */}
            <div className="sticky top-0 space-y-2 border-b bg-white px-4 py-3">
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500"
                placeholder="Search (name, email, #id, status)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="flex flex-wrap items-center gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map(
                  (k) => (
                    <button
                      key={k}
                      onClick={() => setStatusFilter(k)}
                      className={[
                        "rounded-full px-3 py-1 text-xs border",
                        statusFilter === k
                          ? "text-white border-transparent"
                          : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50",
                      ].join(" ")}
                      style={
                        statusFilter === k
                          ? {
                              background:
                                "linear-gradient(135deg, #b10015 0%, #0f2741 100%)",
                            }
                          : undefined
                      }
                    >
                      {k[0].toUpperCase() + k.slice(1)}
                    </button>
                  )
                )}

                <div className="ml-auto flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={showUnreadOnly}
                      onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    />
                    Unread only
                  </label>

                  <select
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900"
                    value={sort}
                    onChange={(e) =>
                      setSort(e.target.value as "new" | "old" | "unread")
                    }
                  >
                    <option value="new">Newest activity</option>
                    <option value="old">Oldest activity</option>
                    <option value="unread">Unread first</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Thread list */}
            <div className="max-h-[65vh] overflow-auto">
              {!filteredThreads.length && (
                <div className="px-4 py-10 text-center text-sm text-gray-500">
                  No conversations.
                </div>
              )}

              <ul ref={listRef} className="divide-y divide-gray-100">
                {filteredThreads.map((c, i) => {
                  const cid = Number(c.id);
                  const preview = lastByClaim[cid] || "No messages yet";
                  const unread = unreadByClaim[cid] || 0;
                  const who = meIsStaff
                    ? c.claimant_name || c.claimant_email || "Student"
                    : `Staff • Claim #${cid}`;
                  const initials = initialsFrom(
                    c.claimant_name,
                    c.claimant_email
                  );
                  const lastAt = lastTimeByClaim[cid] || c.created_at || "";
                  const isActive = i === activeIndex;

                  return (
                    <li key={cid}>
                      <button
                        onClick={() => openThread(c)}
                        className={[
                          "flex w-full items-center gap-3 px-4 py-3 text-left",
                          isActive ? "bg-indigo-50" : "hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-[12px] font-semibold text-gray-700">
                          {initials}
                        </div>

                        <div className="min-w-0 grow">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {who}
                            </div>
                            {meIsStaff && (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${statusPillClasses(
                                  c.status
                                )}`}
                              >
                                {c.status || "—"}
                              </span>
                            )}
                            <span className="ml-auto text-[11px] text-gray-500">
                              {timeAgo(lastAt)}
                            </span>
                          </div>

                          {meIsStaff && c.claimant_email && (
                            <div className="truncate text-[11px] text-gray-500">
                              {c.claimant_email}
                            </div>
                          )}

                          <div className="truncate text-xs text-gray-600">
                            {preview}
                          </div>
                        </div>

                        <div className="ml-2 shrink-0 space-y-1 text-right">
                          <div className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                            #{cid}
                          </div>
                          {unread > 0 && (
                            <div className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {unread}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Chat modal */}
      {chatOpen && chatClaim && (
        <ChatModal
          open={chatOpen}
          claim={chatClaim}
          onClose={() => setChatOpen(false)}
          meIsStaff={meIsStaff}
          currentUid={uid}
        />
      )}
    </>
  );
}
