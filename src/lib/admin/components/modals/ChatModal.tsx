"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Claim } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { CREEK_NAVY, CREEK_RED } from "../../constants";
import { Portal } from "../../Portal";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { logEvent } from "@/lib/audit";

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

function formatMessageTime(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatModal({
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

  /* load user + messages */
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

      await supabase
        .from("claim_messages")
        .update({ seen_by_staff: true })
        .eq("claim_id", claim.id)
        .neq("sender_uid", u.user?.id ?? "");
    })();
  }, [claim.id]);

  /* realtime */
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
          const row = payload.new as ChatMessage;

          setMsgs((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });

          if (meIsStaff && row.sender_uid !== myUid) {
            supabase
              .from("claim_messages")
              .update({ seen_by_staff: true })
              .eq("id", row.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [claim.id, meIsStaff, myUid]);

  /* auto scroll */
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
      <div className="fixed inset-0 z-[100] animate-fadeIn">
        {/* overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="animate-scaleIn flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            {/* header */}
            <div
              className="flex items-center justify-between px-5 py-3 text-white"
              style={{ background: CREEK_NAVY }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Claim #{claim.id}</h2>

                  <span
                    className="rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: CREEK_RED }}
                  >
                    Staff Messaging
                  </span>
                </div>

                <div className="mt-1 text-sm text-blue-100">
                  {(claim as any).claimant_name}
                </div>

                <div className="truncate text-xs text-blue-200">
                  {(claim as any).claimant_email}
                </div>
              </div>

              <button
                className="rounded-md border border-white/20 px-3 py-1 text-sm hover:bg-white/10 transition"
                onClick={onClose}
              >
                Close
              </button>
            </div>

            {/* messages */}
            <div
              ref={listRef}
              className="max-h-[45vh] min-h-[240px] overflow-y-auto bg-slate-50 px-4 py-4"
            >
              {msgs.length === 0 ? (
                <div className="flex h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-center text-sm">
                  <div
                    className="rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase"
                    style={{ background: "#EEF4FF", color: CREEK_NAVY }}
                  >
                    No conversation yet
                  </div>

                  <p className="mt-2 font-semibold text-gray-700">
                    No messages for this claim.
                  </p>

                  <p className="mt-1 max-w-sm text-xs text-gray-500">
                    Contact the student to verify ownership or coordinate
                    pickup.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {msgs.map((m) => {
                    const mine = m.sender_uid === myUid;
                    const isStaff = m.sender_role === "staff";

                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
                        } animate-messageIn`}
                      >
                        <div className="max-w-[75%]">
                          <div
                            className={`text-[10px] mb-1 ${
                              mine ? "text-right" : "text-left"
                            } text-gray-500`}
                          >
                            {mine
                              ? meIsStaff
                                ? "You • Staff"
                                : "You"
                              : isStaff
                                ? "Staff"
                                : "Student"}
                          </div>

                          <div
                            className={`rounded-xl px-3 py-2 text-sm shadow-sm ${
                              mine
                                ? "text-white"
                                : "bg-white border border-gray-200 text-gray-800"
                            }`}
                            style={
                              mine ? { background: CREEK_NAVY } : undefined
                            }
                          >
                            {m.body}
                          </div>

                          <div
                            className={`mt-1 text-[10px] ${
                              mine ? "text-right" : "text-left"
                            } text-gray-400`}
                          >
                            {formatMessageTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* composer */}
            <div className="border-t border-gray-200 px-4 py-3">
              <textarea
                className="w-full min-h-[64px] resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Type a message to the student..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={busy}
              />

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Enter to send · Shift + Enter for new line
                </div>

                <button
                  onClick={send}
                  disabled={busy || input.trim().length === 0}
                  className="rounded-md px-4 py-1.5 text-sm font-semibold text-white transition disabled:opacity-50"
                  style={{
                    background:
                      busy || input.trim().length === 0
                        ? "#94A3B8"
                        : CREEK_NAVY,
                  }}
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
