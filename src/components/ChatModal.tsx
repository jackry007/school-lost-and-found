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
          },
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
          mm.id === tempId ? { ...mm, _error: error?.message || "Failed" } : mm,
        ),
      );
      setSending(false);
      return;
    }

    // Replace temp with server row
    setMsgs((prev) =>
      prev.map((mm) => (mm.id === tempId ? (data as LocalMsg) : mm)),
    );

    // My send doesn’t need mark seen; receiver will trigger on their end
    setSending(false);
  }

  const connLabel = useMemo(
    () => (subscribed ? "Live" : "Connecting…"),
    [subscribed],
  );

  if (!open || !claim) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Shell */}
      <div className="absolute inset-0 flex items-start justify-center px-4 pb-6 pt-24 sm:pt-28">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-modal-title"
          className="
          w-full max-w-3xl
          max-h-[calc(100vh-8rem)]
          overflow-hidden rounded-[28px] border border-slate-200/90 bg-white
          shadow-[0_28px_90px_rgba(15,39,65,0.28)]
          flex flex-col
        "
        >
          {/* Header */}
          <div className="relative shrink-0 overflow-hidden border-b border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-r from-[#BF1E2E] via-[#7d1735] to-[#0B2C5C]" />
            <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-start justify-between gap-3 px-5 py-4 text-white">
              <div className="min-w-0">
                <h3
                  id="chat-modal-title"
                  className="truncate text-xl font-semibold tracking-tight"
                >
                  Messages — Claim #{claim.id}
                  <span className="text-white/80">
                    {" "}
                    (Item #{claim.item_id})
                  </span>
                </h3>
                <div className="mt-1 truncate text-sm text-white/85">
                  {claim.claimant_name || claim.claimant_email || "Student"}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                    subscribed
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/10 text-white/90"
                  }`}
                  title="Realtime status"
                >
                  <span
                    className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
                      subscribed
                        ? "bg-emerald-300"
                        : "bg-amber-300 animate-pulse"
                    }`}
                  />
                  {connLabel}
                </span>

                <button
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 bg-slate-50/70 px-4 py-4 sm:px-5">
            <div
              className="h-full overflow-y-auto rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              style={{ scrollBehavior: "smooth" }}
            >
              {msgs.length === 0 ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl">
                    💬
                  </div>
                  <div className="text-lg font-semibold text-slate-800">
                    No messages yet
                  </div>
                  <div className="mt-1 max-w-sm text-sm text-slate-500">
                    Start the conversation here. Messages between staff and the
                    claimant will appear in this thread.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {msgs.map((m) => {
                    const mine = m.sender_uid === currentUid;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] ${mine ? "items-end" : "items-start"} flex flex-col`}
                        >
                          {!mine && (
                            <div className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                              {m.sender_role === "staff" ? "Staff" : "Student"}
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm ${
                              mine
                                ? "rounded-br-md bg-gradient-to-r from-[#0B2C5C] to-[#204b87] text-white"
                                : "rounded-bl-md border border-slate-200 bg-slate-100 text-slate-900"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {m.body}
                            </div>
                          </div>

                          <div
                            className={`mt-1 px-1 text-[11px] ${
                              mine ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {fmtTime(m.created_at)}
                            {m._temp && !m._error && " · sending…"}
                            {m._error && (
                              <span className="ml-1 font-medium text-rose-500">
                                · failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
            <div className="flex items-end gap-3">
              <div className="flex-1">
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
                  placeholder="Type a message…"
                  className="
                  w-full resize-none rounded-[20px] border border-slate-300 bg-white px-4 py-3 text-sm
                  text-slate-900 placeholder-slate-400 shadow-sm
                  focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100
                "
                  rows={1}
                  maxLength={4000}
                />
                <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-500">
                  <span>Enter to send · Shift+Enter for newline</span>
                  <span className="text-slate-400">
                    {input.length.toLocaleString()}/4,000
                  </span>
                </div>
              </div>

              <button
                onClick={send}
                className="
                inline-flex h-[48px] shrink-0 items-center justify-center rounded-[18px]
                bg-gradient-to-r from-[#BF1E2E] to-[#0B2C5C]
                px-5 text-sm font-semibold text-white shadow-sm transition
                hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50
              "
                disabled={sending || input.trim().length === 0}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
