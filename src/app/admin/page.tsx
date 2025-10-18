// src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Item, Claim } from "@/lib/types";

// Local widen so we can compare to 'pending'/'rejected' without changing your global Item type yet.
type ItemStatusWidened = Item["status"] | "pending" | "rejected";
type StatusFilter = "all" | "pending" | "listed" | "claimed" | "rejected";

// Creek-ish palette (using Tailwind arbitrary colors)
const CREEK_RED = "#b10015"; // deep scarlet
const CREEK_NAVY = "#0f2741"; // dark navy
const CREEK_SOFTR = "#fef2f3"; // soft red tint
const CREEK_SOFTN = "#f1f5fb"; // soft navy tint

export default function AdminPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "staff" | "user" | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Tier 1: filters + search + inline edit modal ----
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [q, setQ] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});

  const load = async () => {
    setLoading(true);

    // --- auth/role guard ---
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      router.replace("/auth/login");
      return;
    }

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("uid", uid)
      .single();

    if (profErr || !prof || !["admin", "staff"].includes(prof.role)) {
      alert("Not authorized");
      router.replace("/");
      return;
    }
    setRole(prof.role as "admin" | "staff");

    // --- fetch items/claims ---
    const [{ data: its }, { data: cls }] = await Promise.all([
      supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    setItems((its as Item[]) || []);
    setClaims((cls as Claim[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Actions =====
  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setItems([]);
    setClaims([]);
    router.replace("/");
  };

  const updateClaim = async (id: number, status: "approved" | "rejected") => {
    if (!confirm(`Set claim #${id} → ${status}?`)) return;
    const { error } = await supabase
      .from("claims")
      .update({ status })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  const markItemClaimed = async (id: number) => {
    if (!confirm(`Mark item #${id} as claimed?`)) return;
    const { error } = await supabase
      .from("items")
      .update({ status: "claimed" })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  const updateItemStatus = async (
    id: number,
    status: "listed" | "rejected"
  ) => {
    if (!confirm(`Set item #${id} → ${status}?`)) return;
    const { error } = await supabase
      .from("items")
      .update({ status })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  // Inline Edit
  const openEdit = (it: Item) => {
    setEditItem(it);
    setEditForm({
      title: it.title,
      category: it.category,
      // @ts-expect-error we treat location as part of your Item table
      location: (it as any).location ?? null,
      description: it.description,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const payload: Partial<Item> = {
      title: editForm.title ?? editItem.title,
      category: editForm.category ?? editItem.category,
      // @ts-expect-error ensure your table column is "location"
      location:
        (editForm as any).location ?? (editItem as any).location ?? null,
      description: editForm.description ?? editItem.description,
    };
    const { error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", editItem.id);
    if (error) return alert(error.message);
    setEditOpen(false);
    setEditItem(null);
    setEditForm({});
    load();
  };

  const restoreToListed = async (id: number) => {
    if (!confirm(`Restore item #${id} back to 'listed'?`)) return;
    const { error } = await supabase
      .from("items")
      .update({ status: "listed" })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  // ===== Derived data =====
  const pendingItems = items.filter(
    (i) => (i.status as ItemStatusWidened) === "pending"
  );
  const pendingClaims = claims.filter((c) => c.status === "pending");

  const visibleItems = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      const s = it.status as ItemStatusWidened;
      const passStatus = statusFilter === "all" ? true : s === statusFilter;
      const passSearch =
        !needle ||
        [it.id, it.title, it.category, (it as any).location, it.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle));
      return passStatus && passSearch;
    });
  }, [items, statusFilter, q]);

  // ===== Tier 2 Analytics =====
  const {
    totalItems,
    totalClaims,
    listedCount,
    claimedCount,
    pendingCount,
    rejectedCount,
    returnRatePct,
    topCats,
    topLocs,
  } = useMemo(() => {
    const totalItems = items.length;
    const totalClaims = claims.length;

    let listed = 0,
      claimed = 0,
      pending = 0,
      rejected = 0;

    const THIRTY_D_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_D_MS;

    const cat30 = new Map<string, number>();
    const loc30 = new Map<string, number>();

    for (const it of items) {
      const s = it.status as ItemStatusWidened;
      if (s === "listed") listed++;
      else if (s === "claimed") claimed++;
      else if (s === "pending") pending++;
      else if (s === "rejected") rejected++;

      const cat = (it.category ?? "Uncategorized").trim();
      const loc = ((it as any).location ?? "—").trim();

      const created = new Date(it.created_at).getTime();
      if (!Number.isNaN(created) && created >= cutoff) {
        cat30.set(cat, (cat30.get(cat) ?? 0) + 1);
        loc30.set(loc, (loc30.get(loc) ?? 0) + 1);
      }
    }

    const denom = listed + claimed;
    const returnRatePct = denom ? Math.round((claimed / denom) * 100) : 0;

    const topCats = Array.from(cat30.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const topLocs = Array.from(loc30.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalItems,
      totalClaims,
      listedCount: listed,
      claimedCount: claimed,
      pendingCount: pending,
      rejectedCount: rejected,
      returnRatePct,
      topCats,
      topLocs,
    };
  }, [items, claims]);

  if (loading) {
    return (
      <div className="min-h-[60vh]">
        <Header role={role} onSignOut={signOut} />
        <div className="animate-pulse max-w-6xl mx-auto p-6 space-y-6">
          <div className="h-24 rounded-2xl bg-gray-100" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100" />
            ))}
          </div>
          <div className="h-10 rounded-xl bg-gray-100" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header role={role} onSignOut={signOut} />

      <main className="max-w-6xl mx-auto p-6 space-y-10">
        {/* Analytics */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total items"
              value={totalItems}
              tint={CREEK_SOFTN}
            />
            <StatCard
              label="Total claims"
              value={totalClaims}
              tint={CREEK_SOFTR}
            />
            <StatCard label="Listed" value={listedCount} tint="#eef7ff" />
            <StatCard label="Claimed" value={claimedCount} tint="#eefcf3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatCard label="Pending" value={pendingCount} tint="#fff6e8" />
            <StatCard label="Rejected" value={rejectedCount} tint="#fdeff0" />
            <StatCard
              label="Return rate"
              value={`${returnRatePct}%`}
              tint="#f5f7ff"
            />
            <Card className="p-4">
              <div className="text-xs text-gray-500 mb-2">
                Top categories (30d)
              </div>
              {topCats.length ? (
                <ul className="text-sm space-y-1">
                  {topCats.map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="truncate">{k}</span>
                      <span className="ml-2 text-gray-700">{v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-600">—</div>
              )}
            </Card>
          </div>

          <Card className="p-4 mt-4">
            <div className="text-xs text-gray-500 mb-2">
              Top locations (30d)
            </div>
            {topLocs.length ? (
              <ul className="text-sm grid gap-1 sm:grid-cols-2">
                {topLocs.map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="truncate">{k}</span>
                    <span className="ml-2 text-gray-700">{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">—</div>
            )}
          </Card>
        </section>

        {/* Moderation queues */}
        <section className="space-y-6">
          <SectionHeading>
            Pending Items <Badge tone="amber">{pendingItems.length}</Badge>
          </SectionHeading>
          <div className="space-y-3">
            {pendingItems.length === 0 && <EmptyRow text="No pending items." />}
            {pendingItems.map((it) => (
              <Row key={it.id}>
                <RowInfo
                  title={`#${it.id} · ${it.title}`}
                  meta={`${it.category ?? "—"} · ${
                    (it as any).location ?? "—"
                  } · submitted ${new Date(it.created_at).toLocaleString()}`}
                />
                <RowActions>
                  <Btn
                    tone="primary"
                    onClick={() => updateItemStatus(it.id, "listed")}
                  >
                    Approve & List
                  </Btn>
                  <Btn
                    tone="danger"
                    onClick={() => updateItemStatus(it.id, "rejected")}
                  >
                    Reject
                  </Btn>
                  <Btn tone="ghost" onClick={() => openEdit(it)}>
                    Edit
                  </Btn>
                </RowActions>
              </Row>
            ))}
          </div>

          <SectionHeading>
            Pending Claims <Badge tone="amber">{pendingClaims.length}</Badge>
          </SectionHeading>
          <div className="space-y-3">
            {pendingClaims.length === 0 && (
              <EmptyRow text="No pending claims." />
            )}
            {pendingClaims.map((c) => (
              <Row key={c.id}>
                <RowInfo
                  title={`Claim #${c.id} → Item #${c.item_id}`}
                  meta={`${c.claimant_name} (${c.claimant_email})${
                    c.proof ? ` · Proof: ${c.proof}` : ""
                  }`}
                />
                <RowActions>
                  <Btn
                    tone="primary"
                    onClick={() => updateClaim(c.id, "approved")}
                  >
                    Approve
                  </Btn>
                  <Btn
                    tone="danger"
                    onClick={() => updateClaim(c.id, "rejected")}
                  >
                    Reject
                  </Btn>
                </RowActions>
              </Row>
            ))}
          </div>
        </section>

        {/* Filters + items */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "all",
                  "pending",
                  "listed",
                  "claimed",
                  "rejected",
                ] as StatusFilter[]
              ).map((sf) => (
                <Pill
                  key={sf}
                  active={statusFilter === sf}
                  onClick={() => setStatusFilter(sf)}
                >
                  {sf[0].toUpperCase() + sf.slice(1)}
                </Pill>
              ))}
            </div>
            <div className="relative w-full sm:w-80">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search items…"
                className="w-full rounded-full border px-4 py-2 pl-10 outline-none focus:ring-2"
                style={{
                  borderColor: "#e5e7eb",
                  boxShadow: `0 0 0 0 rgba(0,0,0,0)`,
                }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {visibleItems.length === 0 && (
              <EmptyRow text="No items match your filters." />
            )}
            {visibleItems.map((it) => {
              const s = it.status as ItemStatusWidened;
              return (
                <Row key={it.id}>
                  <RowInfo
                    title={`#${it.id} · ${it.title}`}
                    meta={
                      <>
                        <StatusBadge status={s} /> · {it.category ?? "—"} ·{" "}
                        {(it as any).location ?? "—"}
                      </>
                    }
                  />
                  <RowActions>
                    {s === "pending" && (
                      <>
                        <Btn
                          tone="primary"
                          onClick={() => updateItemStatus(it.id, "listed")}
                        >
                          Approve & List
                        </Btn>
                        <Btn
                          tone="danger"
                          onClick={() => updateItemStatus(it.id, "rejected")}
                        >
                          Reject
                        </Btn>
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                      </>
                    )}
                    {s === "listed" && (
                      <>
                        <Btn
                          tone="primary"
                          onClick={() => markItemClaimed(it.id)}
                        >
                          Mark Claimed
                        </Btn>
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                      </>
                    )}
                    {s === "claimed" && (
                      <>
                        <Btn tone="ghost" onClick={() => openEdit(it)}>
                          Edit
                        </Btn>
                        <Btn
                          tone="secondary"
                          onClick={() => restoreToListed(it.id)}
                        >
                          Restore to Listed
                        </Btn>
                      </>
                    )}
                    {s === "rejected" && (
                      <Btn
                        tone="secondary"
                        onClick={() => restoreToListed(it.id)}
                      >
                        Restore to Listed
                      </Btn>
                    )}
                  </RowActions>
                </Row>
              );
            })}
          </div>
        </section>
      </main>

      {/* ---- Inline Edit Modal ---- */}
      {editOpen && editItem && (
        <Modal
          onClose={() => setEditOpen(false)}
          title={`Edit Item #${editItem.id}`}
        >
          <div className="grid gap-3">
            <Labeled label="Title">
              <input
                className="border rounded-xl px-3 py-2"
                value={editForm.title ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Labeled>

            <Labeled label="Category">
              <input
                className="border rounded-xl px-3 py-2"
                value={editForm.category ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </Labeled>

            <Labeled label="Location">
              <input
                className="border rounded-xl px-3 py-2"
                value={((editForm as any).location ?? "") as string}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    ...({ location: e.target.value } as any),
                  }))
                }
              />
            </Labeled>

            <Labeled label="Description">
              <textarea
                className="border rounded-xl px-3 py-2 min-h-28"
                value={editForm.description ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Labeled>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Btn tone="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Btn>
            <Btn tone="primary" onClick={saveEdit}>
              Save changes
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===================== Pretty UI bits ===================== */

function Header({
  role,
  onSignOut,
}: {
  role: string | null;
  onSignOut: () => void;
}) {
  return (
    <header
      className="w-full"
      style={{
        background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-6 text-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-white/80">
            Creek Lost & Found • moderation & insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className="text-xs rounded-full px-2 py-1 bg-white/10 ring-1 ring-white/20">
              Signed in as <strong className="font-semibold">{role}</strong>
            </span>
          )}
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-full bg-white text-[13px] font-medium hover:bg-white/90 shadow"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold flex items-center gap-2">
      {children}
    </h2>
  );
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "amber" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
      children={children}
    />
  );
}

function StatCard({
  label,
  value,
  tint = "#f8fafc",
}: {
  label: string;
  value: number | string;
  tint?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4"
      style={{ background: `linear-gradient(180deg, ${tint} 0%, white 60%)` }}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1 tracking-tight">{value}</div>
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm shadow-sm border transition ${
        active ? "text-white" : "text-gray-700 hover:bg-gray-50"
      }`}
      style={{
        borderColor: active ? "transparent" : "#e5e7eb",
        background: active
          ? `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`
          : "white",
      }}
    >
      {children}
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex items-center justify-between">
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
      {text}
    </div>
  );
}

function RowInfo({
  title,
  meta,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="font-medium truncate">{title}</div>
      {meta && (
        <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
          {meta}
        </div>
      )}
    </div>
  );
}

function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 shrink-0">{children}</div>;
}

function Btn({
  children,
  onClick,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    primary: `text-white shadow-sm`,
    secondary: `text-[${CREEK_NAVY}] bg-[${CREEK_SOFTN}] border border-[${CREEK_NAVY}]`,
    danger: `text-white shadow-sm`,
    ghost: `text-gray-700 border border-gray-200 bg-white hover:bg-gray-50`,
  };
  const background =
    tone === "primary"
      ? `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`
      : tone === "danger"
      ? `linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)`
      : "transparent";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm ${styles[tone]}`}
      style={{ background }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ItemStatusWidened }) {
  const look =
    status === "pending"
      ? "bg-amber-100 text-amber-800"
      : status === "listed"
      ? "bg-blue-100 text-blue-800"
      : status === "claimed"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-rose-100 text-rose-800";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${look}`}>
      {status}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-[95%] max-w-lg shadow-2xl border border-gray-200">
          <div
            className="px-4 py-3 rounded-t-2xl text-white"
            style={{
              background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{title}</h3>
              <button
                className="text-sm text-white/90 hover:text-white"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      {children}
    </label>
  );
}
