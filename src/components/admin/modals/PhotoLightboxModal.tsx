"use client";

import { Modal } from "@/lib/admin/components/modals/Modal";

type Props = {
  open: boolean;
  title: string;
  category?: string;
  location?: string;
  description?: string;
  urls: string[];
  onClose: () => void;
};

export default function PhotoLightboxModal({
  open,
  title,
  category,
  location,
  description,
  urls,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_340px]">
        {/* IMAGE AREA */}
        <div>
          {urls?.length ? (
            <div className="grid gap-4">
              {urls.map((u, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt={`photo-${i}`}
                    className="max-h-[70vh] w-full object-contain transition-transform duration-200 hover:scale-[1.02]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No photos attached.</div>
          )}
        </div>

        {/* DETAILS PANEL */}
        <aside className="flex flex-col gap-4">
          {/* INFO CARD */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
            {category && (
              <div className="mb-4">
                <div className="text-xs font-semibold tracking-wider text-gray-500">
                  CATEGORY
                </div>
                <div className="mt-1 text-lg font-medium text-gray-900">
                  {category}
                </div>
              </div>
            )}

            {location && (
              <div>
                <div className="text-xs font-semibold tracking-wider text-gray-500">
                  LOCATION FOUND
                </div>
                <div className="mt-1 text-lg font-medium text-gray-900">
                  {location}
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPTION CARD */}
          {description && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500">
                DESCRIPTION
              </div>
              <div className="text-sm leading-relaxed text-gray-700">
                {description}
              </div>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
