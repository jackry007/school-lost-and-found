"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ChatClaim = {
  id: number;
  item_id: number;
  claimant_name: string | null;
  claimant_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  claimant_uid?: string | null;
};

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

function fmtTime(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

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
  const [msgs, setMsgs] = useState<ClaimMessage[]>([]);
  const [input, setInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  /* ===========================================================
     1️⃣ Load messages + subscribe to realtime changes
     =========================================================== */
  useEffect(() => {
    // 🚫 Guard: don’t run if closed or claim is null
    if (!open || !claim) return;

    let active = true;
    const claimId = claim.id;

    // load messages & mark as seen
    (async () => {
      const { data, error } = await supabase
        .from("claim_messages")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (!error && data) setMsgs(data as ClaimMessage[]);

      const field = meIsStaff ? "seen_by_staff" : "seen_by_claimant";
      await supabase
        .from("claim_messages")
        .update({ [field]: true })
        .eq("claim_id", claimId)
        .eq(field, false);

      // realtime listener
      const ch = supabase
        .channel(`cm-${claimId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "claim_messages",
            filter: `claim_id=eq.${claimId}`,
          },
          (payload) => {
            const msg = payload.new as ClaimMessage;
            setMsgs((prev) => [...prev, msg]);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setSubscribed(true);
        });

      // ✅ cleanup (sync — no async return)
      return () => {
        active = false;
        supabase.removeChannel(ch);
      };
    })();

    // ✅ outer cleanup (stops effect early if claim changes)
    return () => {
      active = false;
    };
  }, [open, claim, meIsStaff]);

  /* ===========================================================
     2️⃣ Auto-scroll when new messages arrive
     =========================================================== */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgs.length]);

  /* ===========================================================
     3️⃣ Send message (optimistic)
     =========================================================== */
  async function send() {
    const text = input.trim();
    if (!text || !claim) return;

    setInput("");

    const optimisticMsg: ClaimMessage = {
      id: Date.now(),
      claim_id: claim.id,
      sender_uid: currentUid,
      sender_role: meIsStaff ? "staff" : "claimant",
      body: text,
      created_at: new Date().toISOString(),
      seen_by_claimant: meIsStaff,
      seen_by_staff: !meIsStaff,
    };

    // add locally
    setMsgs((m) => [...m, optimisticMsg]);

    // send to supabase
    const { error } = await supabase.from("claim_messages").insert({
      claim_id: claim.id,
      sender_uid: currentUid,
      sender_role: optimisticMsg.sender_role,
      body: text,
    });

    if (error) console.error("Send failed:", error.message);
  }

  /* ===========================================================
     4️⃣ Render
     =========================================================== */
  if (!open || !claim) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[95%] max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#b10015] to-[#0f2741] px-4 py-3 text-white">
            <h3 className="text-base font-semibold">
              Messages — Claim #{claim.id} (Item #{claim.item_id})
            </h3>
            <button
              className="text-sm text-white/90 hover:text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="p-4">
            {/* Messages list */}
            <div className="rounded-xl border bg-white p-3">
              <div
                ref={listRef}
                className="max-h-[45vh] overflow-auto pr-2"
                style={{ scrollBehavior: "smooth" }}
              >
                {msgs.length === 0 && (
                  <div className="text-sm text-gray-500">No messages yet.</div>
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
                        <div>{m.body}</div>
                        <div
                          className={`mt-1 text-[10px] ${
                            mine ? "text-white/80" : "text-gray-500"
                          }`}
                        >
                          {fmtTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input box */}
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="w-full rounded-xl border px-3 py-2"
              />
              <button
                onClick={send}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={!subscribed}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
