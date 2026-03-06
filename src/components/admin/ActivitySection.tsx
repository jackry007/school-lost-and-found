"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Btn, SectionHeading } from "@/lib/admin/components";
import { CompactLogRow } from "@/components/admin/rows/CompactLogRow";

export type ActivitySectionProps = {
  logRows: any[];
  logLoading: boolean;
  logLoadedOnce: boolean;
  logHasMore: boolean;
  onLoadMore: () => void;
};

const PAGE_SIZE = 20;

export default function ActivitySection({
  logRows,
  logLoading,
  logLoadedOnce,
  logHasMore,
  onLoadMore,
}: ActivitySectionProps) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "item" | "claim" | "message">("all");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    return logRows.filter((r: any) => {
      const entity = String(r?.entity_type ?? r?.kind ?? "").toLowerCase();
      const event = String(r?.event_type ?? r?.event ?? "").toLowerCase();
      const text = JSON.stringify(r).toLowerCase();
      const needle = q.trim().toLowerCase();

      const matchesKind =
        kind === "all"
          ? true
          : kind === "item"
            ? entity.includes("item") || event.includes("item")
            : kind === "claim"
              ? entity.includes("claim") || event.includes("claim")
              : entity.includes("message") || event.includes("message");

      const matchesSearch = !needle || text.includes(needle);

      return matchesKind && matchesSearch;
    });
  }, [logRows, q, kind]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [q, kind]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
  }

  const counts = useMemo(() => {
    let item = 0;
    let claim = 0;
    let message = 0;

    for (const r of logRows) {
      const blob = JSON.stringify(r).toLowerCase();
      if (blob.includes("message")) message++;
      else if (blob.includes("claim")) claim++;
      else if (blob.includes("item")) item++;
    }

    return {
      total: logRows.length,
      item,
      claim,
      message,
    };
  }, [logRows]);

  return (
    <section className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading>Activity Log</SectionHeading>
        <div className="text-sm text-gray-500">
          Showing {filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, filteredRows.length)} of{" "}
          {filteredRows.length}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Events
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {counts.total}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Item Actions
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {counts.item}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Claim Actions
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {counts.claim}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Messages
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {counts.message}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search activity…"
                className="w-full rounded-full border border-gray-200 px-4 py-2 pl-10 text-sm outline-none focus:ring-2"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "item", "claim", "message"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    kind === value
                      ? "border-transparent bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {value === "all"
                    ? "All"
                    : value === "item"
                      ? "Items"
                      : value === "claim"
                        ? "Claims"
                        : "Messages"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!logLoadedOnce && logLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading activity…</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-600">
            No activity matches your filters.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 bg-white">
              {pagedRows.map((r: any) => (
                <li
                  key={r.event_id ?? r.id}
                  className="transition hover:bg-gray-50"
                >
                  <CompactLogRow row={r} />
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-900">{page}</span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">{totalPages}</span>
              </div>

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

                {logHasMore && (
                  <Btn tone="ghost" onClick={onLoadMore}>
                    Load more from server
                  </Btn>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
