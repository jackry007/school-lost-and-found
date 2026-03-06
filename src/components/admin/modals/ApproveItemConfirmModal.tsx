"use client";

import type { Item } from "@/lib/types";
import { ConfirmModal } from "@/lib/admin/components/modals/ConfirmModal";

type Props = {
  open: boolean;
  busy: boolean;
  target: Item | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ApproveItemConfirmModal({
  open,
  busy,
  target,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <ConfirmModal
      open={open}
      busy={busy}
      title="Approve this item?"
      confirmLabel="Approve & List"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {target ? (
        <p>
          Set <strong>#{target.id}</strong> — “{target.title}” to{" "}
          <strong>listed</strong>? It will appear publicly in Search and on the
          home page.
        </p>
      ) : null}
    </ConfirmModal>
  );
}
