"use client";

import { Modal } from "@/lib/admin/components/modals/Modal";

type Props = {
  open: boolean;
  title: string;
  urls: string[];
  onClose: () => void;
};

export default function PhotoLightboxModal({
  open,
  title,
  urls,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={onClose}>
      {urls && urls.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {urls.map((u, i) => (
            <div key={i} className="overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt={`photo-${i}`}
                className="w-full object-contain"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-600">No photos attached.</div>
      )}
    </Modal>
  );
}
