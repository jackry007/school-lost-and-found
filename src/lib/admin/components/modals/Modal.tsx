// src/lib/admin/components/modals/Modal.tsx
"use client";
import React from "react";
import { CREEK_NAVY, CREEK_RED } from "../../constants";
import { Portal } from "../../Portal";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useBodyScrollLock(true);
  return (
    <Portal>
      <div className="fixed inset-0 z-[100]">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-[95%] max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div
                className="rounded-t-2xl px-4 py-3 text-white"
                style={{
                  background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{title}</h3>
                  <button
                    className="text-sm text-white/90 hover:text-white"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
