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

/* ---------- Brand tokens ---------- */
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";
const CREEK_BLUE_SOFT = "#EAF1FB";
const CREEK_RED_SOFT = "#FCECEE";

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

function statusPillClasses(s?: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "pending")
    return "border border-amber-200 bg-amber-50 text-amber-800";
  if (v === "approved")
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  if (v === "rejected")
    return "border border-rose-200 bg-rose-50 text-rose-800";
  if (v === "claimed")
    return "border border-violet-200 bg-violet-50 text-violet-800";
  if (v === "listed") return "border border-sky-200 bg-sky-50 text-sky-800";
  return "border border-slate-200 bg-slate-50 text-slate-700";
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
    {},
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

  // Refs
  const launcherRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const meIsStaff = role === "admin" || role === "staff";
  const totalUnread = Object.values(unreadByClaim).reduce((a, b) => a + b, 0);

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
          "id,item_id,claimant_name,claimant_email,status,created_at,claimant_uid",
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
          "id,claim_id,body,created_at,seen_by_claimant,seen_by_staff,sender_role",
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
        },
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
    [meIsStaff],
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
          "id,item_id,claimant_name,claimant_email,status,created_at,claimant_uid",
        )
        .eq("id", claimId)
        .limit(1);

      if (!meIsStaff) q = q.eq("claimant_uid", uid);

      const { data } = await q;
      if (data && data[0]) openThread(data[0] as ChatClaim);
    },
    [threadsById, uid, meIsStaff],
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

  /* ---------- filtered/sorted threads ---------- */
  const filteredThreads = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    let arr = threads.filter((t) => {
      if (
        statusFilter !== "all" &&
        (t.status || "").toLowerCase() !== statusFilter
      ) {
        return false;
      }

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

  /* ---------- keyboard nav ---------- */
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

  /* ---------- scoped globals ---------- */
  const globalCSS = `
    .messages-portal select,
    .messages-portal input,
    .messages-portal textarea {
      color: #0f172a !important;
      background: #ffffff !important;
    }

    .messages-portal input::placeholder {
      color: #64748b !important;
    }

    .messages-portal .avatar {
      background:
        radial-gradient(circle at 30% 30%, #ffffff 0%, #eef4ff 28%, #dbe7fb 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
    }

    .messages-portal .portal-scroll::-webkit-scrollbar {
      width: 10px;
    }

    .messages-portal .portal-scroll::-webkit-scrollbar-thumb {
      background: #d6deea;
      border-radius: 999px;
      border: 2px solid #f8fafc;
    }

    .messages-portal .portal-scroll::-webkit-scrollbar-track {
      background: #f8fafc;
    }
  `;

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
            "border border-white/30 bg-white/10 text-white transition hover:bg-white/20",
            "focus:outline-none focus:ring-2 focus:ring-white/60",
          ].join(" ")}
          title="Messages"
        >
          Messages
          {totalUnread > 0 && (
            <span
              className="ml-1 inline-flex min-w-[1.35rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: CREEK_RED }}
            >
              {totalUnread}
            </span>
          )}
        </button>

        {open && (
          <div
            ref={portalRef}
            className="messages-portal fixed right-4 top-16 z-[70] w-[460px] max-w-[94vw] overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_28px_90px_rgba(11,44,92,0.24)] flex flex-col"
            style={{
              maxHeight: "min(820px, calc(100vh - 96px))",
            }}
          >
            {/* Header */}
            <div
              className="relative shrink-0 overflow-hidden border-b border-slate-200 px-5 py-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 72%)`,
              }}
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-white/10 blur-xl" />

              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-base shadow-sm backdrop-blur">
                      💬
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold tracking-tight">
                          Messages
                        </h3>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/95">
                          {threads.length}
                        </span>
                      </div>
                      <p className="truncate text-xs text-white/80">
                        Cherry Creek Lost & Found inbox
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="shrink-0 space-y-3 border-b border-slate-200 bg-white px-4 py-4">
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  placeholder="Search by name, email, claim ID, or status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map(
                  (k) => {
                    const active = statusFilter === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setStatusFilter(k)}
                        className={[
                          "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                          active
                            ? "border-transparent text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        style={
                          active
                            ? {
                                background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
                              }
                            : undefined
                        }
                      >
                        {k[0].toUpperCase() + k.slice(1)}
                      </button>
                    );
                  },
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  />
                  Unread only
                </label>

                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
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

            {/* Thread list */}
            <div className="portal-scroll min-h-0 flex-1 overflow-auto bg-slate-50/60">
              {!filteredThreads.length && (
                <div className="px-6 py-12 text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border"
                    style={{
                      background: CREEK_BLUE_SOFT,
                      borderColor: "#D7E3F7",
                      color: CREEK_NAVY,
                    }}
                  >
                    💬
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    No conversations found
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Try changing your search or filters.
                  </div>
                </div>
              )}

              <ul ref={listRef} className="p-2">
                {filteredThreads.map((c, i) => {
                  const cid = Number(c.id);
                  const preview = lastByClaim[cid] || "No messages yet";
                  const unread = unreadByClaim[cid] || 0;
                  const who = meIsStaff
                    ? c.claimant_name || c.claimant_email || "Student"
                    : `Staff • Claim #${cid}`;
                  const initials = initialsFrom(
                    c.claimant_name,
                    c.claimant_email,
                  );
                  const lastAt = lastTimeByClaim[cid] || c.created_at || "";
                  const isActive = i === activeIndex;

                  return (
                    <li key={cid} className="mb-2 last:mb-0">
                      <button
                        onClick={() => openThread(c)}
                        className={[
                          "group flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                          isActive
                            ? "border-slate-300 bg-white ring-2 ring-slate-100"
                            : "border-transparent bg-white hover:border-slate-200 hover:bg-white hover:shadow-[0_8px_24px_rgba(11,44,92,0.08)]",
                        ].join(" ")}
                      >
                        <div className="relative mt-0.5 shrink-0">
                          <div className="avatar flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[13px] font-semibold text-slate-700">
                            {initials}
                          </div>
                          {unread > 0 && (
                            <span
                              className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: CREEK_RED }}
                            >
                              {unread}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 grow">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 grow">
                              <div className="flex items-center gap-2">
                                <div className="truncate text-[14px] font-semibold text-slate-900">
                                  {who}
                                </div>

                                {meIsStaff && (
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClasses(
                                      c.status,
                                    )}`}
                                  >
                                    {c.status || "—"}
                                  </span>
                                )}
                              </div>

                              {meIsStaff && c.claimant_email && (
                                <div className="mt-0.5 truncate text-[12px] text-slate-500">
                                  {c.claimant_email}
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-[11px] font-medium text-slate-500">
                                {timeAgo(lastAt)}
                              </div>
                              <div className="mt-1">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  #{cid}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-start gap-2">
                            {unread > 0 ? (
                              <span
                                className="mt-[2px] inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: CREEK_RED }}
                                aria-hidden="true"
                              />
                            ) : (
                              <span
                                className="mt-[2px] inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200"
                                aria-hidden="true"
                              />
                            )}

                            <p
                              className={`truncate text-[12.5px] ${
                                unread > 0
                                  ? "font-medium text-slate-800"
                                  : "text-slate-600"
                              }`}
                            >
                              {preview}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {filteredThreads.length} conversation
                  {filteredThreads.length === 1 ? "" : "s"}
                </span>
                <span>{totalUnread} unread</span>
              </div>
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
