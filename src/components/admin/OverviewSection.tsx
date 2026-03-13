"use client";

import { useMemo } from "react";
import type { Item, Claim } from "@/lib/types";
import { CREEK_NAVY, CREEK_RED } from "@/lib/admin/constants";

import {
  Card,
  StatCard,
  Row,
  RowInfo,
  Btn,
  Thumb,
  SectionHeading,
} from "@/lib/admin/components";

type Props = {
  items: Item[];

  totalItems: number;
  totalClaims: number;
  listedCount: number;
  onHoldCount: number;
  pendingCount: number;
  rejectedCount: number;
  topCats: Array<[string, number]>;

  pendingItems: Item[];
  pendingClaims: Claim[];
  approvedClaims: Claim[];
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
  onAskRejectItem: (it: Item) => void;
  onEditItem: (it: Item) => void;

  onOpenPhotos: (data: {
    title: string;
    urls: string[];
    category?: string;
    location?: string;
    description?: string;
  }) => void;

  onOpenChat: (c: Claim) => void;
  onAskApproveClaim: (c: Claim) => void;
  onAskRejectClaim: (c: Claim) => void;
  onMarkPickedUpClaim: (c: Claim) => void;
  onCopyPickupCode: (code?: string | null) => void;
  markBusy: boolean;
};

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "item-photos";

function publicUrlFromPath(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

function formatApprovedAt(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OverviewSection({
  items,

  totalItems,
  totalClaims,
  listedCount,
  onHoldCount,
  pendingCount,
  rejectedCount,
  topCats,

  pendingItems,
  pendingClaims,
  approvedClaims,
  thumbMap,
  claimThumbs,

  logLoadedOnce,
  logLoading,
  logRows,
  onOpenActivityTab,

  onViewAllQueues,

  onAskApproveItem,
  onAskRejectItem,
  onEditItem,

  onOpenPhotos,
  onOpenChat,
  onAskApproveClaim,
  onAskRejectClaim,
  onMarkPickedUpClaim,
  onCopyPickupCode,
  markBusy,
}: Props) {
  const topCatsPreview = useMemo(() => topCats.slice(0, 4), [topCats]);

  const itemsById = useMemo(() => {
    const map: Record<number, Item> = {};
    for (const it of items) {
      map[it.id] = it;
    }
    return map;
  }, [items]);

  function getItemPreviewSrc(it?: Item) {
    if (!it) return "";
    const photoUrl = publicUrlFromPath((it as any).photo_url);
    return photoUrl || thumbMap[it.id] || "";
  }

  function getItemDescription(it?: Item) {
    if (!it) return undefined;
    const desc = (
      ((it as any).description || (it as any).notes || "") as string
    ).trim();
    return desc || undefined;
  }

  function openItemPhotos(it: Item) {
    const src = getItemPreviewSrc(it);
    if (!src) return;

    onOpenPhotos({
      title: `#${it.id} · ${it.title}`,
      urls: [src],
      category: it.category ?? undefined,
      location: (it as any).location ?? undefined,
      description: getItemDescription(it),
    });
  }

  return (
    <div className="mt-4 space-y-10">
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
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
              <div className="text-base font-semibold text-gray-900">
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
                pendingItems.slice(0, 5).map((it) => {
                  const previewSrc = getItemPreviewSrc(it);
                  const hasPhoto = Boolean(previewSrc);

                  return (
                    <Row
                      key={it.id}
                      className="px-4 py-3 transition hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            hasPhoto ? openItemPhotos(it) : undefined
                          }
                          disabled={!hasPhoto}
                          className="rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-default"
                          title={
                            hasPhoto
                              ? "Click to view photo"
                              : "No photo available"
                          }
                          aria-label={`View photo for item ${it.id}`}
                        >
                          <Thumb src={previewSrc} alt={it.title} />
                        </button>

                        <RowInfo
                          title={
                            <span
                              className="block truncate text-base font-semibold text-gray-900"
                              title={it.title}
                            >
                              #{it.id} · {it.title}
                            </span>
                          }
                          meta={
                            <span className="block truncate text-xs text-gray-600">
                              {it.category ?? "—"} ·{" "}
                              {(it as any).location ?? "—"}
                            </span>
                          }
                        />
                      </div>

                      <div className="relative z-10 flex w-full shrink-0 flex-col gap-2 md:w-auto md:min-w-[180px] md:items-end">
                        <div
                          className="flex flex-wrap gap-2 md:justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Btn tone="edit" onClick={() => onEditItem(it)}>
                            Edit
                          </Btn>
                        </div>

                        <div
                          className="flex flex-wrap gap-2 md:justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Btn
                            tone="approve"
                            onClick={() => onAskApproveItem(it)}
                          >
                            Approve
                          </Btn>

                          <Btn
                            tone="reject"
                            onClick={() => onAskRejectItem(it)}
                          >
                            Reject
                          </Btn>
                        </div>
                      </div>
                    </Row>
                  );
                })
              )}
            </div>
          </Card>

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
                  const item = itemsById[c.item_id];
                  const t = claimThumbs[c.id];
                  const itemPreviewSrc = getItemPreviewSrc(item);

                  const claimViewerUrls = (
                    t?.proofs?.length
                      ? t.proofs
                      : t?.itemThumb
                        ? [t.itemThumb]
                        : itemPreviewSrc
                          ? [itemPreviewSrc]
                          : []
                  ) as string[];

                  return (
                    <Row key={c.id} className="px-3 py-2">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            claimViewerUrls.length
                              ? onOpenPhotos({
                                  title: item?.title
                                    ? `#${item.id} · ${item.title}`
                                    : `Item #${c.item_id}`,
                                  urls: claimViewerUrls,
                                  category: item?.category ?? undefined,
                                  location:
                                    (item as any)?.location ?? undefined,
                                  description:
                                    getItemDescription(item) ??
                                    `Claim submitted by ${(c as any).claimant_name || "student"}`,
                                })
                              : undefined
                          }
                          disabled={!claimViewerUrls.length}
                          className="rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-default"
                          title={
                            t?.proofs?.length
                              ? "Click to view proof photos"
                              : "Click to view item photo"
                          }
                          aria-label={
                            t?.proofs?.length
                              ? `View proof photos for claim ${c.id}`
                              : `View item photo for claim ${c.id}`
                          }
                        >
                          <Thumb
                            src={t?.itemThumb || itemPreviewSrc}
                            alt={`Item #${c.item_id}`}
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-semibold text-gray-800">
                            {item?.title
                              ? `Claim #${c.id} → ${item.title}`
                              : `Claim #${c.id} → Item #${c.item_id}`}
                          </div>

                          <div className="mt-0.5 text-xs text-gray-600">
                            {(c as any).claimant_name}
                            <span className="text-gray-400">
                              {" "}
                              ({(c as any).claimant_email})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex w-full shrink-0 flex-col gap-2 md:w-auto md:min-w-[240px] md:items-end">
                        <div
                          className="flex flex-wrap gap-2 md:justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Btn tone="message" onClick={() => onOpenChat(c)}>
                            Message
                          </Btn>
                        </div>

                        <div
                          className="flex flex-wrap gap-2 md:justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Btn
                            tone="approve"
                            onClick={() => onAskApproveClaim(c)}
                          >
                            Approve
                          </Btn>

                          <Btn
                            tone="reject"
                            onClick={() => onAskRejectClaim(c)}
                          >
                            Reject
                          </Btn>
                        </div>
                      </div>
                    </Row>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-1.5 rounded-full"
            style={{ background: CREEK_NAVY }}
            aria-hidden
          />
          <SectionHeading>Ready for Pickup</SectionHeading>
          <span
            className="hidden rounded-full border px-3 py-1 text-sm font-semibold md:inline-flex"
            style={{
              color: "#166534",
              borderColor: "#BBF7D0",
              background: "#F0FDF4",
            }}
          >
            Approved claims
          </span>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
            <div className="text-base font-semibold text-gray-900">
              Approved Claims{" "}
              <span className="font-medium text-gray-500">
                ({approvedClaims.length})
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {approvedClaims.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-600">
                No approved claims waiting for pickup.
              </div>
            ) : (
              approvedClaims.slice(0, 5).map((c) => {
                const item = itemsById[c.item_id];
                const t = claimThumbs[c.id];
                const itemPreviewSrc = getItemPreviewSrc(item);
                const approvedLabel = formatApprovedAt(
                  (c as any).approved_at as string | null | undefined,
                );

                const claimViewerUrls = (
                  t?.proofs?.length
                    ? t.proofs
                    : t?.itemThumb
                      ? [t.itemThumb]
                      : itemPreviewSrc
                        ? [itemPreviewSrc]
                        : []
                ) as string[];

                return (
                  <Row key={c.id} className="px-3 py-2">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          claimViewerUrls.length
                            ? onOpenPhotos({
                                title: item?.title
                                  ? `#${item.id} · ${item.title}`
                                  : `Item #${c.item_id}`,
                                urls: claimViewerUrls,
                                category: item?.category ?? undefined,
                                location: (item as any)?.location ?? undefined,
                                description:
                                  getItemDescription(item) ??
                                  `Approved claim for ${(c as any).claimant_name || "student"}`,
                              })
                            : undefined
                        }
                        disabled={!claimViewerUrls.length}
                        className="rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-default"
                        title={
                          t?.proofs?.length
                            ? "Click to view proof photos"
                            : "Click to view item photo"
                        }
                      >
                        <Thumb
                          src={t?.itemThumb || itemPreviewSrc}
                          alt={`Item #${c.item_id}`}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-gray-800">
                          {item?.title
                            ? `Claim #${c.id} → ${item.title}`
                            : `Claim #${c.id} → Item #${c.item_id}`}
                        </div>

                        <div className="mt-0.5 text-xs text-gray-600">
                          {(c as any).claimant_name}
                          <span className="text-gray-400">
                            {" "}
                            ({(c as any).claimant_email})
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {(c as any).pickup_code ? (
                            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                              Code: {(c as any).pickup_code}
                            </span>
                          ) : null}

                          {approvedLabel ? (
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                              Approved {approvedLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex w-full shrink-0 flex-col gap-2 md:w-auto md:min-w-[300px] md:items-end">
                      <div
                        className="flex flex-wrap gap-2 md:justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Btn tone="message" onClick={() => onOpenChat(c)}>
                          Message
                        </Btn>

                        <Btn
                          tone="ghost"
                          onClick={() =>
                            onCopyPickupCode(
                              (c as any).pickup_code as
                                | string
                                | null
                                | undefined,
                            )
                          }
                        >
                          Copy Code
                        </Btn>
                      </div>

                      <div
                        className="flex flex-wrap gap-2 md:justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Btn
                          tone="success"
                          onClick={() => onMarkPickedUpClaim(c)}
                          disabled={markBusy}
                        >
                          {markBusy ? "Working…" : "Mark Picked Up"}
                        </Btn>
                      </div>
                    </div>
                  </Row>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
