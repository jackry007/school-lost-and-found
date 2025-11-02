"use client";

import { useEffect, useMemo, useState } from "react";
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

/* =========================================================
   Messaging Portal
   ======================================================= */
export default function MessagesPortal() {
  const [uid, setUid] = useState<string>("");
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ChatClaim[]>([]);
  const [lastByClaim, setLastByClaim] = useState<Record<number, string>>({});
  const [unreadByClaim, setUnreadByClaim] = useState<Record<number, number>>(
    {}
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClaim, setChatClaim] = useState<ChatClaim | null>(null);

  const meIsStaff = role === "admin" || role === "staff";

  /* =========================================================
     1️⃣ Load user + role
     ======================================================= */
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

  /* =========================================================
     2️⃣ Load all claim threads
     ======================================================= */
  useEffect(() => {
    if (!uid || !role) return;

    let active = true;
    const loadThreads = async () => {
      // staff sees all; students see their own
      let q = supabase
        .from("claims")
        .select(
          "id,item_id,claimant_name,claimant_email,status,created_at,updated_at,claimant_uid"
        )
        .order("updated_at", { ascending: false });

      if (!meIsStaff) q = q.eq("claimant_uid", uid);

      const { data: cl, error } = await q;
      if (error || !cl || !active) return;

      const claims = cl as ChatClaim[];
      setThreads(claims.slice(0, 50));

      // get last messages for these claims
      const ids = claims.map((c) => c.id);
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
        if (!last[m.claim_id]) last[m.claim_id] = m.body;
        const isUnreadForMe = meIsStaff
          ? !m.seen_by_staff && m.sender_role === "claimant"
          : !m.seen_by_claimant && m.sender_role === "staff";
        if (isUnreadForMe) unread[m.claim_id] = (unread[m.claim_id] || 0) + 1;
      });

      setLastByClaim(last);
      setUnreadByClaim(unread);
    };

    loadThreads();

    return () => {
      active = false;
    };
  }, [uid, role, meIsStaff]);

  /* =========================================================
     3️⃣ Realtime: bump unread & preview
     ======================================================= */
  useEffect(() => {
    if (!uid) return;

    const ch = supabase
      .channel("claim_msg_portal")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "claim_messages",
        },
        (payload) => {
          const m = payload.new as ClaimMessage;
          setLastByClaim((prev) => ({ ...prev, [m.claim_id]: m.body }));

          const mine = m.sender_uid === uid;
          const addressedToMe = meIsStaff
            ? m.sender_role === "claimant"
            : m.sender_role === "staff";

          if (!mine && addressedToMe) {
            setUnreadByClaim((p) => ({
              ...p,
              [m.claim_id]: (p[m.claim_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    // ✅ cleanup (no async return)
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, meIsStaff]);

  /* =========================================================
     4️⃣ Derived data
     ======================================================= */
  const totalUnread = useMemo(
    () => Object.values(unreadByClaim).reduce((a, b) => a + b, 0),
    [unreadByClaim]
  );

  /* =========================================================
     5️⃣ Open a chat thread
     ======================================================= */
  function openThread(c: ChatClaim) {
    setChatClaim(c);
    setChatOpen(true);
    setUnreadByClaim((p) => ({ ...p, [c.id]: 0 })); // clear badge

    const field = meIsStaff ? "seen_by_staff" : "seen_by_claimant";
    supabase
      .from("claim_messages")
      .update({ [field]: true })
      .eq("claim_id", c.id)
      .eq(field, false);
  }

  /* =========================================================
     6️⃣ Render portal UI
     ======================================================= */
  return (
    <>
      {/* Header Button */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative rounded-full bg-white px-3 py-1.5 text-[13px] font-medium shadow hover:bg-white/90"
          title="Messages"
        >
          Messages
          {totalUnread > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
              {totalUnread}
            </span>
          )}
        </button>

        {/* Dropdown List */}
        {open && (
          <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="px-3 py-2 text-xs text-gray-500">Conversations</div>

            <div className="max-h-[60vh] overflow-auto">
              {threads.length === 0 && (
                <div className="px-3 pb-3 text-sm text-gray-600">
                  No conversations yet.
                </div>
              )}

              {threads.map((c) => {
                const preview = lastByClaim[c.id] || "No messages yet";
                const unread = unreadByClaim[c.id] || 0;
                const who = meIsStaff
                  ? `${c.claimant_name || c.claimant_email || "Student"}`
                  : `Staff • Claim #${c.id}`;

                return (
                  <button
                    key={c.id}
                    onClick={() => openThread(c)}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <div
                      className="mt-1 h-2.5 w-2.5 rounded-full"
                      style={{
                        background: unread ? "#b10015" : "#e5e7eb",
                      }}
                    />
                    <div className="min-w-0 grow">
                      <div className="flex items-center justify-between">
                        <div className="truncate text-sm font-medium">
                          {who}
                        </div>
                        <div className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                          #{c.id}
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

      {/* Chat Modal */}
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
