"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/lib/types";
import type { ItemStatusWidened } from "@/lib/admin/selectors";

import type { StatusFilter } from "@/components/admin/types";
import { QUEUE_FILTERS } from "@/components/admin/types";

import {
  Pill,
  Row,
  EmptyRow,
  RowInfo,
  RowActions,
  Btn,
  Thumb,
  StatusBadge,
} from "@/lib/admin/components";
import PhotoLightboxModal from "@/components/admin/modals/PhotoLightboxModal";

type Props = {
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;

  q: string;
  setQ: (v: string) => void;

  visibleItems: Item[];
  thumbMap: Record<number, string>;

  markBusy: boolean;

  onAskApproveItem: (it: Item) => void;
  onRejectItem: (itemId: number) => void;
  onEditItem: (it: Item) => void;
  onQuickPickUp: (itemId: number) => void;
  onRestoreToListed: (itemId: number) => void;
};

type LightboxItem = {
  title: string;
  category?: string;
  location?: string;
  description?: string;
  urls: string[];
};

const PAGE_SIZE = 10;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "item-photos";

function publicUrlFromPath(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export default function QueuesSection({
  statusFilter,
  setStatusFilter,
  q,
  setQ,
  visibleItems,
  thumbMap,
  markBusy,
  onAskApproveItem,
  onRejectItem,
  onEditItem,
  onQuickPickUp,
  onRestoreToListed,
}: Props) {
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visibleItems.slice(start, start + PAGE_SIZE);
  }, [visibleItems, page]);

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
  }

  function getPreviewSrc(it: Item) {
    const photoUrl = publicUrlFromPath((it as any).photo_url);
    return photoUrl || thumbMap[it.id] || "";
  }

  function getItemPhotoUrls(it: Item) {
    const previewSrc = getPreviewSrc(it);
    return previewSrc ? [previewSrc] : [];
  }

  function getItemDescription(it: Item) {
    return (
      ((it as any).description || (it as any).notes || "") as string
    ).trim();
  }

  function openLightbox(it: Item) {
    const urls = getItemPhotoUrls(it);
    if (!urls.length) return;

    const desc = getItemDescription(it);

    setLightbox({
      title: `#${it.id} · ${it.title}`,
      category: it.category ?? undefined,
      location: (it as any).location ?? undefined,
      description: desc || undefined,
      urls,
    });
  }

  return (
    <div className="mt-4 space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {QUEUE_FILTERS.map((sf) => (
              <Pill
                key={sf}
                active={statusFilter === sf}
                onClick={() => {
                  setStatusFilter(sf);
                  setPage(1);
                }}
              >
                {sf.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
              </Pill>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search items…"
              className="w-full rounded-full border px-4 py-2 pl-10 text-sm outline-none focus:ring-2"
              style={{ borderColor: "#e5e7eb" }}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Showing{" "}
          <span className="font-medium text-gray-900">
            {visibleItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
          </span>
          –
          <span className="font-medium text-gray-900">
            {Math.min(page * PAGE_SIZE, visibleItems.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-900">
            {visibleItems.length}
          </span>{" "}
          items
        </div>

        <div className="grid gap-2">
          {visibleItems.length === 0 && (
            <EmptyRow text="No items match your filters." />
          )}

          {paginatedItems.map((it) => {
            const s = it.status as ItemStatusWidened;
            const previewSrc = getPreviewSrc(it);
            const hasPhoto = Boolean(previewSrc);

            return (
              <Row key={it.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openLightbox(it)}
                    disabled={!hasPhoto}
                    title={
                      hasPhoto ? "Open photo preview" : "No photo available"
                    }
                    className="shrink-0 rounded-xl transition hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100"
                  >
                    <Thumb src={previewSrc} alt={it.title} />
                  </button>

                  <RowInfo
                    title={
                      <span className="block max-w-[14rem] truncate text-sm font-medium sm:max-w-[22rem] lg:max-w-[30rem]">
                        #{it.id} · {it.title}
                      </span>
                    }
                    meta={
                      <span className="block truncate text-xs text-gray-500">
                        <StatusBadge status={s} /> · {it.category ?? "—"} ·{" "}
                        {(it as any).location ?? "—"}
                      </span>
                    }
                  />
                </div>

                <RowActions>
                  {s === "pending" && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Btn tone="approve" onClick={() => onAskApproveItem(it)}>
                        Approve &amp; List
                      </Btn>
                      <Btn tone="reject" onClick={() => onRejectItem(it.id)}>
                        Reject
                      </Btn>
                      <Btn tone="ghost" onClick={() => onEditItem(it)}>
                        Edit
                      </Btn>
                    </div>
                  )}

                  {s === "listed" && (
                    <Btn tone="ghost" onClick={() => onEditItem(it)}>
                      Edit
                    </Btn>
                  )}

                  {s === "on_hold" && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="text-xs text-gray-500">
                        Awaiting pickup…
                      </span>
                      <Btn
                        tone="success"
                        onClick={() => onQuickPickUp(it.id)}
                        disabled={markBusy}
                      >
                        {markBusy ? "Working…" : "Mark Picked Up"}
                      </Btn>
                      <Btn
                        tone="ghost"
                        onClick={() => onRestoreToListed(it.id)}
                        disabled={markBusy}
                      >
                        Release Hold
                      </Btn>
                    </div>
                  )}

                  {s === "claimed" && (
                    <span className="text-xs font-medium text-emerald-700">
                      Picked Up 🎉
                    </span>
                  )}

                  {s === "rejected" && (
                    <Btn tone="ghost" onClick={() => onRestoreToListed(it.id)}>
                      Restore to Listed
                    </Btn>
                  )}
                </RowActions>
              </Row>
            );
          })}
        </div>

        {visibleItems.length > PAGE_SIZE && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page <span className="font-medium text-gray-900">{page}</span> of{" "}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <Btn
                tone="ghost"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Btn>
              <Btn
                tone="ghost"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Btn>
            </div>
          </div>
        )}
      </section>

      <PhotoLightboxModal
        open={!!lightbox}
        title={lightbox?.title ?? ""}
        category={lightbox?.category}
        location={lightbox?.location}
        description={lightbox?.description}
        urls={lightbox?.urls ?? []}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
