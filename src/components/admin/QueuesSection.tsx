"use client";

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
  return (
    <div className="space-y-8 mt-4">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {QUEUE_FILTERS.map((sf) => (
              <Pill
                key={sf}
                active={statusFilter === sf}
                onClick={() => setStatusFilter(sf)}
              >
                {sf.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
              </Pill>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-full border px-4 py-2 pl-10 outline-none focus:ring-2"
              style={{ borderColor: "#e5e7eb" }}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                <div className="flex min-w-0 items-center">
                  <Thumb src={thumbMap[it.id]} alt={it.title} />
                  <RowInfo
                    title={
                      <span className="block truncate max-w-[18rem] sm:max-w-[28rem]">
                        #{it.id} · {it.title}
                      </span>
                    }
                    meta={
                      <span className="block truncate">
                        <StatusBadge status={s} /> · {it.category ?? "—"} ·{" "}
                        {(it as any).location ?? "—"}
                      </span>
                    }
                  />
                </div>

                <RowActions>
                  {s === "pending" && (
                    <>
                      <Btn tone="primary" onClick={() => onAskApproveItem(it)}>
                        Approve &amp; List
                      </Btn>
                      <Btn tone="danger" onClick={() => onRejectItem(it.id)}>
                        Reject
                      </Btn>
                      <Btn tone="ghost" onClick={() => onEditItem(it)}>
                        Edit
                      </Btn>
                    </>
                  )}

                  {s === "listed" && (
                    <Btn tone="ghost" onClick={() => onEditItem(it)}>
                      Edit
                    </Btn>
                  )}

                  {s === "on_hold" && (
                    <>
                      <span className="mr-1 text-xs text-gray-500">
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
                        tone="secondary"
                        onClick={() => onRestoreToListed(it.id)}
                        disabled={markBusy}
                      >
                        Release Hold
                      </Btn>
                    </>
                  )}

                  {s === "claimed" && (
                    <span className="text-xs text-emerald-700">
                      Picked Up 🎉
                    </span>
                  )}

                  {s === "rejected" && (
                    <Btn
                      tone="secondary"
                      onClick={() => onRestoreToListed(it.id)}
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
    </div>
  );
}
