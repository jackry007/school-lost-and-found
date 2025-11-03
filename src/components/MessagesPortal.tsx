"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatModal, { type ChatClaim } from "./ChatModal";

type ProfileRole = "admin" | "staff" | "user";

type ClaimMessage = {
  id: number;
  claim_id: number;
  sender_uid: string;
  sender_role: "claimant" | "staff";
  body: string;
  created_at: string;
  seen_by_claimant: boolean;
  seen_by_staff: boolean;
};

export default function MessagesPortal() {
  const [uid, setUid] = useState<string>("");
  const [role, setRole] = useState<ProfileRole | null>(null);

  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ChatClaim[]>([]);
  const [threadsById, setThreadsById] = useState<Record<number, ChatClaim>>({});
  const [lastByClaim, setLastByClaim] = useState<Record<number, string>>({});
  const [unreadByClaim, setUnreadByClaim] = useState<Record<number, number>>(
    {}
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClaim, setChatClaim] = useState<ChatClaim | null>(null);

  // quick picker/search
  const [search, setSearch] = useState("");

  const meIsStaff = role === "admin" || role === "staff";

  /* 1) user + role */
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

  /* 2) load threads + previews + unread */
  useEffect(() => {
    if (!uid || !role) return;
    let alive = true;

    (async () => {
      let q = supabase
        .from("claims")
        .select(
          "id,item_id,claimant_name,claimant_email,status,created_at,updated_at,claimant_uid"
        )
        .order("updated_at", { ascending: false });

      if (!(role === "admin" || role === "staff"))
        q = q.eq("claimant_uid", uid);

      const { data: cl, error } = await q;
      if (error || !cl || !alive) return;

      const claims = cl as ChatClaim[];
      setThreads(claims.slice(0, 200));

      const byId: Record<number, ChatClaim> = {};
      for (const c of claims) byId[Number(c.id)] = c;
      setThreadsById(byId);

      const ids = claims.map((c) => Number(c.id));
      if (ids.length === 0) return;

      const { data: msgs } = await supabase
        .from("claim_messages")
        .select(
          "id,claim_id,body,created_at,seen_by_claimant,seen_by_staff,sender_role"
        )
        .in("claim_id", ids)
        .order("created_at", { ascending: false });

      const last: Record<number, string> = {};
      const unread: Record<number, number> = {};

      (msgs || []).forEach((m) => {
        const cid = Number(m.claim_id);
        if (!last[cid]) last[cid] = m.body;
        const isUnreadForMe = meIsStaff
          ? !m.seen_by_staff && m.sender_role === "claimant"
          : !m.seen_by_claimant && m.sender_role === "staff";
        if (isUnreadForMe) unread[cid] = (unread[cid] || 0) + 1;
      });

      setLastByClaim(last);
      setUnreadByClaim(unread);
    })();

    return () => {
      alive = false;
    };
  }, [uid, role, meIsStaff]);

  /* 3) realtime preview/unread */
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel("claim_msg_portal")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "claim_messages" },
        (payload) => {
          const m = payload.new as ClaimMessage;
          const cid = Number(m.claim_id);
          setLastByClaim((prev) => ({ ...prev, [cid]: m.body }));

          const mine = m.sender_uid === uid;
          const addressedToMe = meIsStaff
            ? m.sender_role === "claimant"
            : m.sender_role === "staff";
          if (!mine && addressedToMe) {
            setUnreadByClaim((p) => ({ ...p, [cid]: (p[cid] || 0) + 1 }));
          }
        }
      )
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [uid, meIsStaff]);

  /* helpers */
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
  }

  const openThreadById = useCallback(
    async (claimId: number) => {
      const cached = threadsById[claimId];
      if (cached) return openThread(cached);

      let q = supabase
        .from("claims")
        .select(
          "id,item_id,claimant_name,claimant_email,status,created_at,updated_at,claimant_uid"
        )
        .eq("id", claimId)
        .limit(1);

      if (!(role === "admin" || role === "staff"))
        q = q.eq("claimant_uid", uid);

      const { data } = await q;
      if (data && data[0]) openThread(data[0] as ChatClaim);
    },
    [threadsById, uid, role]
  );

  // Deep-link and event bus
  const tryAutoOpenFromURL = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const qOpen = url.searchParams.get("openClaim");
    if (qOpen) {
      const cid = Number(qOpen);
      if (!Number.isNaN(cid)) {
        setOpen(true);
        openThreadById(cid);
        return;
      }
    }
    if (url.searchParams.get("chat") === "1") {
      const m = url.pathname.match(/\/claim\/(\d+)(?:\/|$)/);
      if (m) {
        const cid = Number(m[1]);
        if (!Number.isNaN(cid)) {
          setOpen(true);
          openThreadById(cid);
        }
      }
    }
  }, [openThreadById]);

  useEffect(() => {
    if (!uid || !role) return;
    tryAutoOpenFromURL();
  }, [uid, role, tryAutoOpenFromURL]);

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

  /* derived */
  const totalUnread = useMemo(
    () => Object.values(unreadByClaim).reduce((a, b) => a + b, 0),
    [unreadByClaim]
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
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
  }, [threads, search]);

  /* UI */
  return (
    <>
      {/* Scoped styles to make inputs/selects readable in the portal */}
      <style jsx global>{`
        .messages-portal select,
        .messages-portal input,
        .messages-portal textarea {
          color: #111 !important;
          background-color: #fff !important;
        }
        .messages-portal option {
          color: #111 !important;
          background-color: #fff !important;
        }
        .messages-portal input::placeholder,
        .messages-portal textarea::placeholder {
          color: #6b7280 !important; /* gray-500 */
        }
        .messages-portal input:-webkit-autofill {
          -webkit-text-fill-color: #111 !important;
          box-shadow: 0 0 0px 1000px #fff inset !important;
        }
      `}</style>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
            "border border-white/30 bg-white/10 hover:bg-white/18 text-white",
            "focus:outline-none focus:ring-2 focus:ring-white/60 transition",
          ].join(" ")}
          title="Messages"
        >
          Messages
          {totalUnread > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
              {totalUnread}
            </span>
          )}
        </button>

        {open && (
          <div className="messages-portal absolute right-0 mt-2 w-[380px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Picker + Search */}
            <div className="space-y-2 border-b px-3 py-3">
              <label className="block text-[11px] text-gray-600">
                Open a claim
              </label>
              <div className="flex gap-2">
                <select
                  className="w-[72%] rounded-xl border border-gray-200 px-2 py-1.5 text-sm text-gray-900 bg-white"
                  value=""
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    if (!Number.isNaN(cid)) openThreadById(cid);
                  }}
                >
                  <option value="" disabled>
                    Select claim…
                  </option>
                  {threads.map((t) => (
                    <option key={t.id} value={Number(t.id)}>
                      #{t.id} ·{" "}
                      {meIsStaff
                        ? t.claimant_name || t.claimant_email || "Student"
                        : `Status: ${t.status || "—"}`}
                    </option>
                  ))}
                </select>
                <input
                  className="w-[28%] rounded-xl border border-gray-200 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="# id"
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = Number(
                        (e.currentTarget as HTMLInputElement).value
                      );
                      if (!Number.isNaN(v)) openThreadById(v);
                    }
                  }}
                />
              </div>

              <input
                className="w-full rounded-xl border border-gray-200 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-500 bg-white"
                placeholder="Search claims (name, email, #id, status)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-auto">
              {filteredThreads.length === 0 && (
                <div className="px-3 py-3 text-sm text-gray-600">
                  No conversations.
                </div>
              )}

              {filteredThreads.map((c) => {
                const cid = Number(c.id);
                const preview = lastByClaim[cid] || "No messages yet";
                const unread = unreadByClaim[cid] || 0;
                const who = meIsStaff
                  ? `${c.claimant_name || c.claimant_email || "Student"}`
                  : `Staff • Claim #${cid}`;

                return (
                  <button
                    key={cid}
                    onClick={() => openThread(c)}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <div
                      className="mt-1 h-2.5 w-2.5 rounded-full"
                      style={{ background: unread ? "#b10015" : "#e5e7eb" }}
                    />
                    <div className="min-w-0 grow">
                      <div className="flex items-center justify-between">
                        <div className="truncate text-sm font-medium">
                          {who}
                        </div>
                        <div className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                          #{cid}
                        </div>
                      </div>
                      <div className="truncate text-xs text-gray-600">
                        {preview}
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="ml-2 shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t px-3 py-2 text-right">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

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
