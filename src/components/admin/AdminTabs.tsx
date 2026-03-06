"use client";

import { CREEK_RED, CREEK_NAVY } from "@/lib/admin/constants";

export type AdminTab = "Overview" | "Queues" | "Activity";

type Props = {
  tab: AdminTab;
  setTab: (t: AdminTab) => void;
};

export default function AdminTabs({ tab, setTab }: Props) {
  const tabs: AdminTab[] = ["Overview", "Queues", "Activity"];

  return (
    <div className="flex items-center gap-2">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`rounded-full px-3 py-1.5 text-sm border shadow-sm ${
            tab === t ? "text-white" : "text-gray-700 hover:bg-gray-50"
          }`}
          style={{
            borderColor: tab === t ? "transparent" : "#e5e7eb",
            background:
              tab === t
                ? `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`
                : "white",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
