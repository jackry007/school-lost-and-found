// src/lib/admin/components/modals/ConfirmModal.tsx
"use client";
import React, { useEffect } from "react";
import { CREEK_NAVY, CREEK_RED } from "../../constants";
import { Portal } from "../../Portal";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  useBodyScrollLock(open);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100]">
        <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-[95%] max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div
                className="px-4 py-3 text-white"
                style={{
                  background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
                }}
              >
                <h3 className="text-base font-semibold">{title}</h3>
              </div>
              <div className="p-4 text-sm text-gray-800">{children}</div>
              <div className="flex justify-end gap-2 p-4 pt-0">
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={busy}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                  style={{ backgroundColor: CREEK_RED }}
                >
                  {busy ? "Working…" : confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
