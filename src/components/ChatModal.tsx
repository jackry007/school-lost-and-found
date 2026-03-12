// src/lib/admin/components/modals/ChatModal.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
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

/* ========= Motion ========= */

const backdropMotion: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.18 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14 },
  },
};

const shellMotion: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.985,
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const listMotion: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
};

const itemMotion: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
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
    await supabase.rpc("mark_thread_seen", {
      p_claim_id: cid,
      p_uid: currentUid,
    });
  }

  /* ===== Load thread, mark read (RPC), and subscribe realtime ===== */
  useEffect(() => {
    if (!open || !claimId) return;
    let cancelled = false;
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data, error } = await supabase
        .from("claim_messages")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) setMsgs(data as LocalMsg[]);

      await rpcMarkSeen(claimId);

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

      channelRef = ch;
    })();

    return () => {
      cancelled = true;
      setSubscribed(false);
      if (channelRef) supabase.removeChannel(channelRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, claimId, currentUid, meIsStaff]);

  /* ===== Defense-in-depth ===== */
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
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs.length]);

  /* ===== Focus textarea & ESC ===== */
  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ===== Auto-resize textarea ===== */
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const max = 6 * 20;
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

    setMsgs((prev) =>
      prev.map((mm) => (mm.id === tempId ? (data as LocalMsg) : mm)),
    );

    setSending(false);
  }

  const connLabel = useMemo(
    () => (subscribed ? "Live" : "Connecting…"),
    [subscribed],
  );

  if (!open || !claim) return null;

  const modal = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-900/55 backdrop-blur-[3px]"
          onClick={onClose}
          aria-hidden="true"
          variants={backdropMotion}
          initial="initial"
          animate="animate"
          exit="exit"
        />

        {/* Shell */}
        <div className="absolute inset-0 flex items-start justify-center px-4 pb-6 pt-24 sm:pt-28">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-modal-title"
            className="
              flex max-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col
              overflow-hidden rounded-[28px] border border-slate-200/90 bg-white
              shadow-[0_28px_90px_rgba(15,39,65,0.28)]
            "
            variants={shellMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-r from-[#BF1E2E] via-[#7d1735] to-[#0B2C5C]" />
              <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3 px-5 py-4 text-white">
                <motion.div
                  className="min-w-0"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
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
                </motion.div>

                <motion.div
                  className="flex shrink-0 items-center gap-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.07 }}
                >
                  <motion.span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      subscribed
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-white/10 bg-white/10 text-white/90"
                    }`}
                    title="Realtime status"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, delay: 0.1 }}
                  >
                    <span
                      className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
                        subscribed
                          ? "bg-emerald-300"
                          : "bg-amber-300 animate-pulse"
                      }`}
                    />
                    {connLabel}
                  </motion.span>

                  <motion.button
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    onClick={onClose}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Close
                  </motion.button>
                </motion.div>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 bg-slate-50/70 px-4 py-4 sm:px-5">
              <div
                className="h-full overflow-y-auto rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                style={{ scrollBehavior: "smooth" }}
              >
                <AnimatePresence mode="wait">
                  {msgs.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex h-full min-h-[260px] flex-col items-center justify-center text-center"
                    >
                      <motion.div
                        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl"
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.22, delay: 0.04 }}
                      >
                        💬
                      </motion.div>
                      <div className="text-lg font-semibold text-slate-800">
                        No messages yet
                      </div>
                      <div className="mt-1 max-w-sm text-sm text-slate-500">
                        Start the conversation here. Messages between staff and
                        the claimant will appear in this thread.
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="messages"
                      className="space-y-3"
                      variants={listMotion}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                    >
                      {msgs.map((m) => {
                        const mine = m.sender_uid === currentUid;

                        return (
                          <motion.div
                            key={m.id}
                            variants={itemMotion}
                            layout
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex max-w-[82%] flex-col ${mine ? "items-end" : "items-start"}`}
                            >
                              {!mine && (
                                <div className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                                  {m.sender_role === "staff"
                                    ? "Staff"
                                    : "Student"}
                                </div>
                              )}

                              <motion.div
                                layout
                                className={`rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm ${
                                  mine
                                    ? "rounded-br-md bg-gradient-to-r from-[#0B2C5C] to-[#204b87] text-white"
                                    : "rounded-bl-md border border-slate-200 bg-slate-100 text-slate-900"
                                }`}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.18 }}
                              >
                                <div className="whitespace-pre-wrap break-words">
                                  {m.body}
                                </div>
                              </motion.div>

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
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={endRef} />
              </div>
            </div>

            {/* Composer */}
            <motion.div
              className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: 0.08 }}
            >
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

                <motion.button
                  onClick={send}
                  className="
                    inline-flex h-[48px] shrink-0 items-center justify-center rounded-[18px]
                    bg-gradient-to-r from-[#BF1E2E] to-[#0B2C5C]
                    px-5 text-sm font-semibold text-white shadow-sm transition
                    hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50
                  "
                  disabled={sending || input.trim().length === 0}
                  whileHover={
                    sending || input.trim().length === 0
                      ? {}
                      : { y: -1, scale: 1.02 }
                  }
                  whileTap={
                    sending || input.trim().length === 0 ? {} : { scale: 0.98 }
                  }
                >
                  {sending ? "Sending…" : "Send"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
