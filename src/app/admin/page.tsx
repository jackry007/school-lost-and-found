// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Item, Claim } from "@/lib/types";

export default function AdminPage() {
  const [role, setRole] = useState<"admin" | "staff" | "user" | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  const load = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      location.href = "/auth/login";
      return;
    }

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("uid", uid)
      .single();

    if (profErr || !prof || !["admin", "staff"].includes(prof.role)) {
      alert("Not authorized");
      location.href = "/";
      return;
    }
    setRole(prof.role);

    const { data: its } = await supabase
      .from("items")
      .select("*")
      .order("created_at", {
        ascending: false,
      });
    setItems((its as Item[]) || []);

    const { data: cls } = await supabase
      .from("claims")
      .select("*")
      .order("created_at", {
        ascending: false,
      });
    setClaims((cls as Claim[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateClaim = async (id: number, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("claims")
      .update({ status })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  const markItemClaimed = async (id: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "claimed" })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Pending Claims</h2>
        <div className="space-y-2">
          {claims
            .filter((c) => c.status === "pending")
            .map((c) => (
              <div
                key={c.id}
                className="border rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm">
                    Claim #{c.id} for Item #{c.item_id} by{" "}
                    <strong>{c.claimant_name}</strong> ({c.claimant_email})
                  </div>
                  {c.proof && (
                    <div className="text-xs text-gray-600">
                      Proof: {c.proof}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => updateClaim(c.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => updateClaim(c.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          {claims.filter((c) => c.status === "pending").length === 0 && (
            <div className="text-sm text-gray-600">No pending claims.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Items</h2>
        <div className="grid gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="border rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  #{it.id} · {it.title}
                </div>
                <div className="text-xs text-gray-600">Status: {it.status}</div>
              </div>
              <div className="flex gap-2">
                {it.status === "listed" && (
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => markItemClaimed(it.id)}
                  >
                    Mark Claimed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
