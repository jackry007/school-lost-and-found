"use client";

import { useMemo } from "react";
import type { Item, Claim } from "@/lib/types";
import { CREEK_NAVY, CREEK_RED } from "@/lib/admin/constants";

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
  totalItems: number;
  totalClaims: number;
  listedCount: number;
  onHoldCount: number;
  pendingCount: number;
  rejectedCount: number;
  topCats: Array<[string, number]>;

  pendingItems: Item[];
  pendingClaims: Claim[];
  thumbMap: Record<number, string>;
  claimThumbs: Record<
    number,
    { itemThumb?: string; proofs?: string[] } | undefined
  >;

  logLoadedOnce: boolean;
  logLoading: boolean;
  logRows: any[];
  onOpenActivityTab: () => void;

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

function formatSchedChip(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export default function OverviewSection({
  totalItems,
  totalClaims,
  listedCount,
  onHoldCount,
  pendingCount,
  rejectedCount,
  topCats,

  pendingItems,
  pendingClaims,
  thumbMap,
  claimThumbs,

  logLoadedOnce,
  logLoading,
  logRows,
  onOpenActivityTab,

  onViewAllQueues,

  onAskApproveItem,
  onRejectItem,
  onEditItem,

  onOpenPhotos,
  onOpenChat,
  onOpenSchedule,
  onApproveClaim,
  onRejectClaim,
}: Props) {
  const topCatsPreview = useMemo(() => topCats.slice(0, 4), [topCats]);

  return (
    <div className="mt-4 space-y-10">
      {/* Analytics */}
      <section className="space-y-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium tracking-wide text-gray-500">
                Creek Lost &amp; Found
              </div>
              <div className="text-[2rem] font-semibold tracking-tight text-gray-900">
                Moderation Dashboard
              </div>
            </div>

            <div
              className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
              style={{ background: CREEK_NAVY }}
            >
              Admin Overview
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total items" value={totalItems} tint="#FFFFFF" />
            <StatCard label="Total claims" value={totalClaims} tint="#FFFFFF" />
            <StatCard label="Listed" value={listedCount} tint="#EEF2FF" />
            <StatCard label="Pending" value={pendingCount} tint="#FEF2F3" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="p-4 md:col-span-1">
              <div className="text-sm font-medium text-gray-500">Secondary</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm text-gray-500">On Hold</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {onHoldCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm text-gray-500">Rejected</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {rejectedCount}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500">
                  Top categories (30d)
                </div>
                <div className="text-sm text-gray-400">
                  top {topCatsPreview.length || 0}
                </div>
              </div>

              {topCatsPreview.length ? (
                <ul className="space-y-3">
                  {topCatsPreview.map(([k, v]) => (
                    <li
                      key={k}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <span className="truncate font-medium text-gray-900">
                        {k}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {v}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-600">—</div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Pending Snapshot */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-7 w-1.5 rounded-full"
              style={{ background: CREEK_NAVY }}
              aria-hidden
            />
            <SectionHeading>Pending Snapshot</SectionHeading>
            <span
              className="hidden rounded-full border px-3 py-1 text-sm font-semibold md:inline-flex"
              style={{
                color: CREEK_RED,
                borderColor: "#FBCFE8",
                background: "#FFF1F2",
              }}
            >
              Action required
            </span>
          </div>

          <Btn tone="ghost" onClick={onViewAllQueues}>
            View all in Queues →
          </Btn>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Pending Items */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
              <div className="text-xl font-semibold text-gray-900">
                Pending Items{" "}
                <span className="font-medium text-gray-500">
                  ({pendingItems.length})
                </span>
              </div>
              {pendingItems.length > 5 && (
                <span className="pr-2 text-sm text-gray-500">showing 5</span>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {pendingItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">
                  No pending items.
                </div>
              ) : (
                pendingItems.slice(0, 5).map((it) => (
                  <Row key={it.id} className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumb src={thumbMap[it.id]} alt={it.title} />
                      <RowInfo
                        title={
                          <span className="block truncate text-xl font-semibold text-gray-900">
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
                      <Btn tone="approve" onClick={() => onAskApproveItem(it)}>
                        Approve
                      </Btn>
                      <Btn tone="reject" onClick={() => onRejectItem(it.id)}>
                        Reject
                      </Btn>
                      <Btn tone="edit" onClick={() => onEditItem(it)}>
                        Edit
                      </Btn>
                    </RowActions>
                  </Row>
                ))
              )}
            </div>
          </Card>

          {/* Pending Claims */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
              <div className="text-xl font-semibold text-gray-900">
                Pending Claims{" "}
                <span className="font-medium text-gray-500">
                  ({pendingClaims.length})
                </span>
              </div>
              {pendingClaims.length > 3 && (
                <span className="pr-2 text-sm text-gray-500">showing 3</span>
              )}
            </div>

            <div className="divide-y divide-gray-100">
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
                  const schedChip = sched ? formatSchedChip(sched) : null;

                  return (
                    <Row key={c.id} className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Thumb src={t?.itemThumb} alt={`Item #${c.item_id}`} />

                        <RowInfo
                          title={
                            <div className="min-w-0">
                              <div className="truncate text-xl font-semibold text-gray-900">
                                Claim #{c.id} → Item #{c.item_id}
                              </div>

                              <div className="truncate text-gray-600">
                                {(c as any).claimant_name}{" "}
                                <span className="text-gray-400">
                                  ({(c as any).claimant_email})
                                </span>
                                {(c as any).proof && (
                                  <>
                                    {" · "}
                                    <span className="text-gray-500">
                                      proof attached
                                    </span>
                                  </>
                                )}
                              </div>

                              {schedChip && (
                                <div className="mt-2">
                                  <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                    Scheduled: {schedChip}
                                  </span>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {t?.proofs?.length ? (
                          <button
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
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

                        <Btn tone="message" onClick={() => onOpenChat(c)}>
                          Message
                        </Btn>

                        <Btn tone="schedule" onClick={() => onOpenSchedule(c)}>
                          {schedChip ? "Reschedule" : "Schedule"}
                        </Btn>

                        <Btn tone="approve" onClick={() => onApproveClaim(c)}>
                          Approve
                        </Btn>

                        <Btn tone="reject" onClick={() => onRejectClaim(c)}>
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

      {/* Recent Activity */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-1.5 rounded-full"
            style={{ background: CREEK_NAVY }}
            aria-hidden
          />
          <SectionHeading>Recent Activity</SectionHeading>
        </div>

        <Card className="overflow-hidden p-0">
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
            <ul className="divide-y divide-gray-100">
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
