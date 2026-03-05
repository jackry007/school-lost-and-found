// src/components/home/RecentItemsSection.tsx
"use client";

import { ItemCard } from "@/components/ItemCard";

export type RecentCardItem = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  thumb: string;
};

type RecentItemsSectionProps = {
  authLoading: boolean;
  isAuthed: boolean;

  items: RecentCardItem[];

  creekRed: string;
  creekNavy: string;

  onSignIn: () => void;
  onViewAll: () => void;
  onReport: () => void;
};

export function RecentItemsSection({
  authLoading,
  isAuthed,
  items,
  creekRed,
  creekNavy,
  onSignIn,
  onViewAll,
  onReport,
}: RecentItemsSectionProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {authLoading ? (
        <section className="rounded-2xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-600">Loading…</p>
        </section>
      ) : !isAuthed ? (
        <LoginGateCard
          creekRed={creekRed}
          creekNavy={creekNavy}
          onSignIn={onSignIn}
          onReport={onReport}
        />
      ) : items.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: creekNavy }}>
              Recently Reported
            </h2>

            <button
              type="button"
              onClick={onViewAll}
              className="text-sm underline"
              style={{ color: creekRed }}
            >
              View all
            </button>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <li key={it.id}>
                <ItemCard item={it as any} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState creekRed={creekRed} onReport={onReport} />
      )}
    </main>
  );
}

/* ---------- Logged-out CTA (Option 2) ---------- */

function LoginGateCard({
  creekRed,
  creekNavy,
  onSignIn,
  onReport,
}: {
  creekRed: string;
  creekNavy: string;
  onSignIn: () => void;
  onReport: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white py-16">
      {/* subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(11,44,92,0.12) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 text-center">
        {/* icon badge */}
        <div
          className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: "rgba(11,44,92,0.18)" }}
          aria-hidden="true"
        >
          <span className="text-2xl">🎒</span>
        </div>

        <p className="text-2xl font-semibold" style={{ color: creekNavy }}>
          Looking for something you lost?
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Sign in to see recently reported items and check if your item has been
          found.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: creekRed,
              boxShadow: "0 8px 20px rgba(191,30,46,0.22)",
            }}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={onReport}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              color: creekNavy,
              border: "1px solid rgba(11,44,92,0.25)",
              background: "white",
            }}
          >
            Report an item
          </button>
        </div>

        <p className="mt-5 text-xs text-gray-500">
          We limit the list to signed-in users to help protect student privacy.
        </p>
      </div>
    </section>
  );
}

/* ---------- Empty state (logged in, no items) ---------- */

function EmptyState({
  creekRed,
  onReport,
}: {
  creekRed: string;
  onReport: () => void;
}) {
  return (
    <section className="grid place-items-center rounded-2xl border border-dashed border-gray-300 py-16">
      <div className="text-center">
        <p className="text-lg font-medium">No items yet</p>
        <p className="mt-1 text-sm text-gray-600">
          Be the first to add a found item so we can get it back to its owner.
        </p>

        <button
          type="button"
          onClick={onReport}
          className="mt-4 inline-block rounded-lg px-4 py-2 text-white"
          style={{ backgroundColor: creekRed }}
        >
          Report an Item
        </button>
      </div>
    </section>
  );
}
