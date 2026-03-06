"use client";

import type { Item, Claim } from "@/lib/types";
import type { ItemStatusWidened } from "@/lib/admin/selectors";

import {
  Card,
  StatCard,
  Row,
  RowInfo,
  RowActions,
  Btn,
  Thumb,
  SectionHeading,
} from "@/lib/admin/components";
import { CompactLogRow } from "@/components/admin/rows/CompactLogRow";

type Props = {
  // stats
  totalItems: number;
  totalClaims: number;
  listedCount: number;
  onHoldCount: number;
  pendingCount: number;
  rejectedCount: number;
  topCats: Array<[string, number]>;

  // pending snapshot data
  pendingItems: Item[];
  pendingClaims: Claim[];
  thumbMap: Record<number, string>;
  claimThumbs: Record<
    number,
    { itemThumb?: string; proofs?: string[] } | undefined
  >;

  // activity preview (same behavior as your page)
  logLoadedOnce: boolean;
  logLoading: boolean;
  logRows: any[];
  onOpenActivityTab: () => void;

  // overview actions
  onViewAllQueues: () => void;

  onAskApproveItem: (it: Item) => void;
  onRejectItem: (itemId: number) => void;
  onEditItem: (it: Item) => void;

  onOpenPhotos: (title: string, urls: string[]) => void;
  onOpenChat: (c: Claim) => void;
  onOpenSchedule: (c: Claim) => void;
  onApproveClaim: (c: Claim) => void;
  onRejectClaim: (c: Claim) => void;
};

export default function OverviewSection({
  // stats
  totalItems,
  totalClaims,
  listedCount,
  onHoldCount,
  pendingCount,
  rejectedCount,
  topCats,

  // pending snapshot
  pendingItems,
  pendingClaims,
  thumbMap,
  claimThumbs,

  // activity preview
  logLoadedOnce,
  logLoading,
  logRows,
  onOpenActivityTab,

  // nav
  onViewAllQueues,

  // item actions
  onAskApproveItem,
  onRejectItem,
  onEditItem,

  // claim actions
  onOpenPhotos,
  onOpenChat,
  onOpenSchedule,
  onApproveClaim,
  onRejectClaim,
}: Props) {
  return (
    <div className="space-y-8 mt-4">
      {/* Analytics */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total items" value={totalItems} tint="#EFF6FF" />
          <StatCard label="Total claims" value={totalClaims} tint="#FEF2F2" />
          <StatCard label="Listed" value={listedCount} tint="#eef7ff" />
          <StatCard label="On Hold" value={onHoldCount} tint="#fff7ee" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Pending" value={pendingCount} tint="#fff6e8" />
          <StatCard label="Rejected" value={rejectedCount} tint="#fdeff0" />

          <Card className="p-4 md:col-span-2">
            <div className="mb-2 text-xs text-gray-500">
              Top categories (30d)
            </div>
            {topCats.length ? (
              <ul className="space-y-1 text-sm">
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
      </section>

      {/* Pending Snapshots */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading>Pending Snapshot</SectionHeading>
          <Btn tone="ghost" onClick={onViewAllQueues}>
            View all in Queues →
          </Btn>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Pending Items (Top 5) */}
          <Card className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="font-medium">
                Pending Items{" "}
                <span className="text-gray-500">({pendingItems.length})</span>
              </div>
              {pendingItems.length > 5 && (
                <span className="text-xs text-gray-500 pr-2">showing 5</span>
              )}
            </div>

            <div className="divide-y">
              {pendingItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">
                  No pending items.
                </div>
              ) : (
                pendingItems.slice(0, 5).map((it) => (
                  <Row key={it.id} className="px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumb src={thumbMap[it.id]} alt={it.title} />
                      <RowInfo
                        title={
                          <span className="block truncate max-w-[18rem] sm:max-w-[24rem]">
                            #{it.id} · {it.title}
                          </span>
                        }
                        meta={
                          <span className="block truncate text-gray-600">
                            {it.category ?? "—"} · {(it as any).location ?? "—"}
                          </span>
                        }
                      />
                    </div>
                    <RowActions>
                      <Btn tone="primary" onClick={() => onAskApproveItem(it)}>
                        Approve
                      </Btn>
                      <Btn tone="danger" onClick={() => onRejectItem(it.id)}>
                        Reject
                      </Btn>
                      <Btn tone="ghost" onClick={() => onEditItem(it)}>
                        Edit
                      </Btn>
                    </RowActions>
                  </Row>
                ))
              )}
            </div>
          </Card>

          {/* Pending Claims (Top 3) */}
          <Card className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="font-medium">
                Pending Claims{" "}
                <span className="text-gray-500">({pendingClaims.length})</span>
              </div>
              {pendingClaims.length > 3 && (
                <span className="text-xs text-gray-500 pr-2">showing 3</span>
              )}
            </div>

            <div className="divide-y">
              {pendingClaims.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">
                  No pending claims.
                </div>
              ) : (
                pendingClaims.slice(0, 3).map((c) => {
                  const t = claimThumbs[c.id];
                  const sched = (c as any).schedule_at as
                    | string
                    | null
                    | undefined;

                  const schedChip = sched
                    ? new Date(sched).toLocaleString()
                    : null;

                  return (
                    <Row key={c.id} className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Thumb src={t?.itemThumb} alt={`Item #${c.item_id}`} />
                        <RowInfo
                          title={
                            <>
                              Claim #{c.id} → Item #{c.item_id}
                              {schedChip && (
                                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">
                                  {schedChip}
                                </span>
                              )}
                            </>
                          }
                          meta={
                            <>
                              {(c as any).claimant_name} (
                              {(c as any).claimant_email})
                              {(c as any).proof && (
                                <>
                                  {" · "}
                                  <span className="text-gray-500">
                                    proof attached
                                  </span>
                                </>
                              )}
                            </>
                          }
                        />
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {t?.proofs?.length ? (
                          <button
                            className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            onClick={() =>
                              onOpenPhotos(
                                `Proof photos — Claim #${c.id}`,
                                t.proofs || [],
                              )
                            }
                            title="View proof photos"
                          >
                            View Proofs ({t.proofs.length})
                          </button>
                        ) : null}

                        <Btn tone="ghost" onClick={() => onOpenChat(c)}>
                          Message
                        </Btn>
                        <Btn tone="ghost" onClick={() => onOpenSchedule(c)}>
                          {schedChip ? "Reschedule" : "Schedule"}
                        </Btn>
                        <Btn tone="primary" onClick={() => onApproveClaim(c)}>
                          Approve
                        </Btn>
                        <Btn tone="danger" onClick={() => onRejectClaim(c)}>
                          Reject
                        </Btn>
                      </div>
                    </Row>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Activity (preview) */}
      <section className="space-y-3">
        <SectionHeading>Recent Activity</SectionHeading>
        <Card>
          {!logLoadedOnce ? (
            <div className="p-4 text-sm text-gray-500">
              Open the Activity tab to load logs…
            </div>
          ) : logLoading ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : logRows.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-600">
              No activity yet.
            </div>
          ) : (
            <ul className="divide-y">
              {logRows.slice(0, 8).map((r) => (
                <CompactLogRow key={r.event_id ?? r.id} row={r} />
              ))}
            </ul>
          )}
        </Card>

        <div className="flex justify-end">
          <Btn tone="ghost" onClick={onOpenActivityTab}>
            Open full Activity Log →
          </Btn>
        </div>
      </section>
    </div>
  );
}
