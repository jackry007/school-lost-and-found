// src/lib/admin/components/modals/ChatModal.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

/* ========= Types ========= */

export type ChatClaim = {
  id: number;
  item_id: number;
  claimant_name: string | null;
  claimant_email: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  claimant_uid?: string | null;
};

type SenderRole = "claimant" | "staff" | "student";

type ClaimMessage = {
  id: number;
  claim_id: number;
  sender_uid: string;
  sender_role: SenderRole;
  body: string;
  created_at: string;
  seen_by_claimant: boolean | null;
  seen_by_staff: boolean | null;
};

type LocalMsg = ClaimMessage & { _temp?: boolean; _error?: string | null };

/* ========= Utils ========= */

function fmtTime(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(+d)) return ts;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString();
}

/* ========= Component ========= */

export default function ChatModal({
  open,
  claim,
  onClose,
  meIsStaff,
  currentUid,
}: {
  open: boolean;
  claim: ChatClaim | null;
  onClose: () => void;
  meIsStaff: boolean;
  currentUid: string;
}) {
  const [msgs, setMsgs] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sending, setSending] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const claimId = claim?.id ?? null;

  // Which "seen" column conceptually applies to THIS viewer (for UI logic only)
  const seenField = meIsStaff ? "seen_by_staff" : "seen_by_claimant";
  const addressedToMe = (r: SenderRole) =>
    meIsStaff ? r === "claimant" || r === "student" : r === "staff";

  /* ===== Lock background scroll while open ===== */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ===== Helper: server-side mark seen via RPC (bypasses RLS) ===== */
  async function rpcMarkSeen(cid: number) {
    // idempotent; does nothing if already seen
    await supabase.rpc("mark_thread_seen", {
      p_claim_id: cid,
      p_uid: currentUid,
    });
  }

  /* ===== Load thread, mark read (RPC), and subscribe realtime ===== */
  useEffect(() => {
    if (!open || !claimId) return;
    let cancelled = false;

    (async () => {
      // 1) Load existing messages
      const { data, error } = await supabase
        .from("claim_messages")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) setMsgs(data as LocalMsg[]);

      // 2) Mark seen on server (SECURITY DEFINER RPC handles claimant vs staff)
      await rpcMarkSeen(claimId);

      // 3) Realtime subscription
      const ch = supabase
        .channel(`claim_messages:${claimId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "claim_messages",
            filter: `claim_id=eq.${claimId}`,
          },
          async (payload) => {
            const msg = payload.new as ClaimMessage;
            setMsgs((prev) => [...prev, msg]);

            // If it's from the opposite side while I’m watching, mark seen via RPC
            if (
              msg.sender_uid !== currentUid &&
              addressedToMe(msg.sender_role)
            ) {
              await rpcMarkSeen(claimId);
            }
          }
        )
        .subscribe((status) => {
          if (!cancelled && status === "SUBSCRIBED") setSubscribed(true);
        });

      return () => {
        supabase.removeChannel(ch);
      };
    })();

    return () => {
      cancelled = true;
      setSubscribed(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, claimId, currentUid, meIsStaff]);

  /* ===== Defense-in-depth: when the last message changes and is from the other side, mark seen ===== */
  useEffect(() => {
    if (!open || !claimId || msgs.length === 0) return;
    const last = msgs[msgs.length - 1];
    const mine = last.sender_uid === currentUid;
    if (!mine && addressedToMe(last.sender_role)) {
      rpcMarkSeen(claimId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs.length, open, claimId, currentUid]);

  /* ===== Keep scrolled to bottom ===== */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  /* ===== Focus textarea & ESC ===== */
  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ===== Auto-resize textarea up to ~6 lines ===== */
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const max = 6 * 20; // ~20px per line
    ta.style.height = Math.min(max, ta.scrollHeight) + "px";
  }, [input]);

  /* ===== Send (optimistic) ===== */
  async function send() {
    if (!claimId) return;
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    const tempId = Date.now();
    const optimistic: LocalMsg = {
      id: tempId,
      claim_id: claimId,
      sender_uid: currentUid,
      sender_role: meIsStaff ? "staff" : "claimant",
      body: text,
      created_at: new Date().toISOString(),
      // Local UI: my own message is already seen on my side
      seen_by_claimant: meIsStaff ? false : true,
      seen_by_staff: meIsStaff ? true : false,
      _temp: true,
      _error: null,
    };
    setMsgs((m) => [...m, optimistic]);

    const { data, error } = await supabase
      .from("claim_messages")
      .insert({
        claim_id: claimId,
        sender_uid: currentUid,
        sender_role: optimistic.sender_role,
        body: text,
        // Initialize flags on insert so unread counts are stable
        seen_by_staff: meIsStaff ? true : false,
        seen_by_claimant: meIsStaff ? false : true,
      })
      .select("*")
      .single();

    if (error || !data) {
      setMsgs((prev) =>
        prev.map((mm) =>
          mm.id === tempId ? { ...mm, _error: error?.message || "Failed" } : mm
        )
      );
      setSending(false);
      return;
    }

    // Replace temp with server row
    setMsgs((prev) =>
      prev.map((mm) => (mm.id === tempId ? (data as LocalMsg) : mm))
    );

    // My send doesn’t need mark seen; receiver will trigger on their end
    setSending(false);
  }

  const connLabel = useMemo(
    () => (subscribed ? "Live" : "Connecting…"),
    [subscribed]
  );

  if (!open || !claim) return null;

  const modal = (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Shell */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-modal-title"
          className="
            w-full max-w-lg
            max-h-[min(90vh,800px)]
            overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl
            grid grid-rows-[auto,1fr,auto]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#b10015] to-[#0f2741] px-4 py-3 text-white">
            <div className="min-w-0">
              <h3
                id="chat-modal-title"
                className="truncate text-base font-semibold"
              >
                Messages — Claim #{claim.id} (Item #{claim.item_id})
              </h3>
              <div className="mt-0.5 truncate text-xs text-white/80">
                {claim.claimant_name || claim.claimant_email || "Student"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                  subscribed ? "bg-white/20" : "bg-white/10"
                }`}
                title="Realtime status"
              >
                <span
                  className={`mr-1 inline-block h-2 w-2 rounded-full ${
                    subscribed ? "bg-emerald-300" : "bg-amber-300 animate-pulse"
                  }`}
                />
                {connLabel}
              </span>
              <button
                className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 overflow-hidden">
            <div
              className="h-full overflow-y-auto rounded-xl border bg-white p-3"
              style={{ maxHeight: "56vh", scrollBehavior: "smooth" }}
            >
              {msgs.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">
                  No messages yet.
                </div>
              )}

              {msgs.map((m) => {
                const mine = m.sender_uid === currentUid;
                return (
                  <div
                    key={m.id}
                    className={`mb-2 flex ${
                      mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        mine
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {m.body}
                      </div>
                      <div
                        className={`mt-1 text-[10px] ${
                          mine ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {fmtTime(m.created_at)}
                        {m._temp && !m._error && " · sending…"}
                        {m._error && (
                          <span className="ml-1 text-rose-400">· failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="border-t bg-white px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending) send();
                  }
                }}
                placeholder="Type a message…  (Enter to send, Shift+Enter for newline)"
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                           text-gray-900 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={1}
                maxLength={4000}
              />
              <button
                onClick={send}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={sending || input.trim().length === 0}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
              <span>
                Press <kbd className="rounded border px-1">Enter</kbd> to send
              </span>
              <span className="text-gray-400">
                {input.length.toLocaleString()}/4,000
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
