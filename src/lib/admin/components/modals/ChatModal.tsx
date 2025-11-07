// src/lib/admin/components/modals/ChatModal.tsx
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

  // Load user + existing messages
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

  // Realtime subscribe
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
