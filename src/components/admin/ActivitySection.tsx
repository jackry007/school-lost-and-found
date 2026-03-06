"use client";

import { Card, Btn, SectionHeading } from "@/lib/admin/components";
import { CompactLogRow } from "@/components/admin/rows/CompactLogRow";

export type ActivitySectionProps = {
  logRows: any[];
  logLoading: boolean;
  logLoadedOnce: boolean;
  logHasMore: boolean;
  onLoadMore: () => void;
};

export default function ActivitySection({
  logRows,
  logLoading,
  logLoadedOnce,
  logHasMore,
  onLoadMore,
}: ActivitySectionProps) {
  return (
    <section className="space-y-3 mt-4">
      <SectionHeading>Activity Log</SectionHeading>

      <Card>
        {!logLoadedOnce && logLoading ? (
          <div className="p-4 text-sm text-gray-500">Loading…</div>
        ) : logRows.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-600">
            No activity yet.
          </div>
        ) : (
          <>
            <ul className="divide-y">
              {logRows.map((r: any) => (
                <CompactLogRow key={r.event_id ?? r.id} row={r} />
              ))}
            </ul>

            <div className="p-3 flex justify-center">
              {logLoading ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : logHasMore ? (
                <Btn tone="ghost" onClick={onLoadMore}>
                  Load more
                </Btn>
              ) : (
                <span className="text-xs text-gray-400">End of results</span>
              )}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
