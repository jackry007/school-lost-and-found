"use client";

import type { Item } from "@/lib/types";
import { Modal } from "@/lib/admin/components/modals/Modal";
import { Btn, Labeled } from "@/lib/admin/components";

export type EditItemForm = Partial<Item> & {
  location?: string;
};

type Props = {
  open: boolean;
  item: Item | null;
  form: EditItemForm;
  setForm: React.Dispatch<React.SetStateAction<EditItemForm>>;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

export default function EditItemModal({
  open,
  item,
  form,
  setForm,
  saving = false,
  onClose,
  onSave,
}: Props) {
  if (!open || !item) return null;

  return (
    <Modal onClose={onClose} title={`Edit Item #${item.id}`}>
      <div className="grid gap-3">
        <Labeled label="Title">
          <input
            className="rounded-xl border px-3 py-2"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </Labeled>

        <Labeled label="Category">
          <input
            className="rounded-xl border px-3 py-2"
            value={form.category ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
          />
        </Labeled>

        <Labeled label="Location">
          <input
            className="rounded-xl border px-3 py-2"
            value={form.location ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
          />
        </Labeled>

        <Labeled label="Description">
          <textarea
            className="min-h-28 rounded-xl border px-3 py-2"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </Labeled>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Btn tone="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Btn>
        <Btn tone="success" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Btn>
      </div>
    </Modal>
  );
}
