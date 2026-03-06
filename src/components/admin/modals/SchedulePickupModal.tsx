"use client";

import type { Claim } from "@/lib/types";
import { Modal } from "@/lib/admin/components/modals/Modal";
import { Btn, Labeled } from "@/lib/admin/components";

type Props = {
  open: boolean;
  claim: Claim | null;
  schedAt: string; // datetime-local value (yyyy-mm-ddThh:mm)
  setSchedAt: (v: string) => void;
  busy?: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

export default function SchedulePickupModal({
  open,
  claim,
  schedAt,
  setSchedAt,
  busy = false,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <Modal
      title={`Schedule Pickup — Claim #${claim?.id ?? "—"}`}
      onClose={onClose}
    >
      <div className="grid gap-3">
        <Labeled label="Date & time">
          <input
            type="datetime-local"
            value={schedAt}
            onChange={(e) => setSchedAt(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />
        </Labeled>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Btn tone="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Btn>
        <Btn tone="primary" onClick={onSave} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Btn>
      </div>
    </Modal>
  );
}
