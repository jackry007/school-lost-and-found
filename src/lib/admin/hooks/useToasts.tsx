import { useState } from "react";

type Toast = {
  id: number;
  msg: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = (
    msg: string,
    opts?: { actionLabel?: string; onAction?: () => void; ttl?: number }
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, msg, ...opts }]);
    const ttl = opts?.ttl ?? 3000;
    if (!opts?.onAction) setTimeout(() => remove(id), ttl);
    return id;
  };

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const node = (
    <div className="fixed right-3 top-3 z-[120] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-md bg-gray-900/95 px-3 py-2 text-sm text-white shadow-lg"
        >
          <span>{t.msg}</span>
          {t.actionLabel && (
            <button
              className="rounded border border-white/20 px-2 py-0.5 text-xs hover:bg-white/10"
              onClick={() => {
                t.onAction?.();
                remove(t.id);
              }}
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => remove(t.id)}
            className="ml-1 rounded px-2 py-0.5 text-xs text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  return { add, remove, node };
}
