"use client";

type CompactLogRowProps = {
  row: any;
};

function renderDetails(action: string, details: any) {
  if (!details) return null;

  if (details.item_id) return `Item #${details.item_id}`;
  if (details.claim_id) return `Claim #${details.claim_id}`;
  if (details.pickup_code) return `Pickup code: ${details.pickup_code}`;

  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

export function CompactLogRow({ row }: CompactLogRowProps) {
  const ts = row.occurred_at ?? row.at;
  const who = row.actor_name ?? row.actor_uid ?? null;

  return (
    <div className="px-3 py-2 flex items-start justify-between gap-3 text-[13px]">
      <div className="min-w-0 flex items-center gap-2">
        {/* Entity badge */}
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-800">
          {row.entity_type}
          {row.entity_id ? `#${row.entity_id}` : ""}
        </span>

        {/* Action badge */}
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-800">
          {row.action}
        </span>

        {/* Details */}
        <div className="min-w-0 truncate text-gray-700">
          {renderDetails(row.action, row.details)}
        </div>

        {/* Actor */}
        {who && (
          <span className="shrink-0 text-[11px] text-gray-500 ml-1">
            · {who}
          </span>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-[11px] text-gray-500">
        {ts ? new Date(ts).toLocaleString() : ""}
      </div>
    </div>
  );
}
