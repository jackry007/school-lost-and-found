// src/components/home/RecentItemsSection.tsx
"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
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

/* ---------- Motion ---------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerWrap: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const cardMotion: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    },
  },
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
    <motion.section
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      initial="hidden"
      animate="show"
      variants={fadeUp}
    >
      <AnimatePresence mode="wait">
        {authLoading ? (
          <motion.div
            key="loading"
            className="rounded-2xl border border-dashed border-gray-300 py-10 text-center sm:py-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-gray-600">Loading…</p>
          </motion.div>
        ) : !isAuthed ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <LoginGateCard
              creekRed={creekRed}
              creekNavy={creekNavy}
              onSignIn={onSignIn}
              onReport={onReport}
            />
          </motion.div>
        ) : items.length > 0 ? (
          <motion.div
            key="items"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={staggerWrap}
          >
            <motion.div
              variants={fadeUp}
              className="mb-4 flex items-end justify-between gap-3"
            >
              <div className="min-w-0">
                <h2
                  className="text-xl font-extrabold tracking-tight sm:text-2xl"
                  style={{ color: creekNavy }}
                >
                  Recently Reported
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Latest found items added by staff and students.
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onViewAll}
                className="shrink-0 text-sm font-medium underline underline-offset-2"
                style={{ color: creekRed }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                View all
              </motion.button>
            </motion.div>

            <motion.ul
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4"
              variants={staggerWrap}
            >
              {items.map((it) => (
                <motion.li
                  key={it.id}
                  variants={cardMotion}
                  layout
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0"
                >
                  <ItemCard item={it as any} />
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <EmptyState creekRed={creekRed} onReport={onReport} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ---------- Logged-out CTA ---------- */

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
    <section className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white py-12 sm:py-16">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(11,44,92,0.12) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.35 }}
      />

      <motion.div
        className="relative mx-auto flex max-w-xl flex-col items-center px-5 text-center sm:px-6"
        initial="hidden"
        animate="show"
        variants={staggerWrap}
      >
        <motion.div
          variants={popIn}
          className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border bg-white shadow-sm sm:h-14 sm:w-14"
          style={{ borderColor: "rgba(11,44,92,0.18)" }}
          aria-hidden="true"
          whileHover={{ y: -2, rotate: -3 }}
        >
          <span className="text-xl sm:text-2xl">🎒</span>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-xl font-semibold sm:text-2xl"
          style={{ color: creekNavy }}
        >
          Looking for something you lost?
        </motion.p>

        <motion.p
          variants={fadeUp}
          className="mt-2 text-sm leading-6 text-gray-600"
        >
          Sign in to see recently reported items and check if your item has been
          found.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-6 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
        >
          <motion.button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: creekRed,
              boxShadow: "0 8px 20px rgba(191,30,46,0.22)",
            }}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign in
          </motion.button>

          <motion.button
            type="button"
            onClick={onReport}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              color: creekNavy,
              border: "1px solid rgba(11,44,92,0.25)",
              background: "white",
            }}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Report an item
          </motion.button>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-5 text-xs text-gray-500">
          We limit the list to signed-in users to help protect student privacy.
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ---------- Empty state ---------- */

function EmptyState({
  creekRed,
  onReport,
}: {
  creekRed: string;
  onReport: () => void;
}) {
  return (
    <section className="grid place-items-center rounded-2xl border border-dashed border-gray-300 py-12 sm:py-16">
      <motion.div
        className="text-center px-4"
        initial="hidden"
        animate="show"
        variants={staggerWrap}
      >
        <motion.div
          variants={popIn}
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-xl shadow-sm sm:h-14 sm:w-14"
        >
          📭
        </motion.div>

        <motion.p variants={fadeUp} className="text-lg font-medium">
          No items yet
        </motion.p>

        <motion.p variants={fadeUp} className="mt-1 text-sm text-gray-600">
          Be the first to add a found item so we can get it back to its owner.
        </motion.p>

        <motion.button
          type="button"
          onClick={onReport}
          className="mt-4 inline-block rounded-lg px-4 py-2 text-white"
          style={{ backgroundColor: creekRed }}
          variants={fadeUp}
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Report an Item
        </motion.button>
      </motion.div>
    </section>
  );
}
