// src/components/home/StatsSection.tsx
"use client";

import { motion, type Variants } from "framer-motion";

export type LiveStats = {
  totalItems: number;
  claimed: number;
  recent: number;
  claimRate: number; // 0-100
};

type StatsSectionProps = {
  stats: LiveStats;
  creekRed: string;
  creekNavy: string;
};

const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.0, ease: easeOutQuint },
  },
};

const stagger: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.12 },
  },
};

export function StatsSection({
  stats,
  creekRed,
  creekNavy,
}: StatsSectionProps) {
  const { totalItems, claimed, recent, claimRate } = stats;

  const safePct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const barClaimed = totalItems ? safePct((claimed / totalItems) * 100) : 0;
  const barRecent = totalItems ? safePct((recent / totalItems) * 100) : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader
        title="Program stats"
        kicker="At a glance"
        creekRed={creekRed}
        creekNavy={creekNavy}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <CreekStat
          icon="🧾"
          label="Total items logged"
          value={totalItems}
          bar={100}
          creekRed={creekRed}
          creekNavy={creekNavy}
        />
        <CreekStat
          icon="🎉"
          label="Items reunited"
          value={claimed}
          bar={barClaimed}
          creekRed={creekRed}
          creekNavy={creekNavy}
        />
        <CreekStat
          icon="📆"
          label="Past 30 days"
          value={recent}
          bar={barRecent}
          creekRed={creekRed}
          creekNavy={creekNavy}
        />
        <CreekStat
          icon="📈"
          label="Claim rate"
          value={`${safePct(claimRate)}%`}
          bar={safePct(claimRate)}
          creekRed={creekRed}
          creekNavy={creekNavy}
        />
      </motion.div>
    </section>
  );
}

function CreekStat({
  icon,
  label,
  value,
  bar = 70,
  creekRed,
  creekNavy,
}: {
  icon: string;
  label: string;
  value: string | number;
  bar?: number;
  creekRed: string;
  creekNavy: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className="rounded-2xl border bg-white p-4 shadow-sm transition-colors duration-200 will-change-transform hover:shadow-lg"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xl">{icon}</div>
        <div
          className="text-2xl font-extrabold tabular-nums"
          style={{ color: creekNavy }}
        >
          {value}
        </div>
      </div>

      <div className="mt-2 text-[12px] text-gray-600">{label}</div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: creekRed }}
          initial={{ width: 0 }}
          whileInView={{ width: `${bar}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

/* ---------- Section Header ---------- */

function SectionHeader({
  title,
  kicker,
  creekRed,
  creekNavy,
}: {
  title: string;
  kicker?: string;
  creekRed: string;
  creekNavy: string;
}) {
  return (
    <div className="mb-5">
      {kicker && (
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: creekNavy }}
        >
          {kicker}
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <svg width="28" height="32" viewBox="0 0 24 28" aria-hidden>
          <path
            d="M12 0l10 4v8c0 7-5 12-10 16C7 24 2 19 2 12V4l10-4z"
            fill={creekRed}
          />
          <path
            d="M12 3l7 2v6c0 5-4 9-7 12-3-3-7-7-7-12V5l7-2z"
            fill="white"
            opacity=".95"
          />
          <path
            d="M12 4.5l5 1.5v5c0 4-3.2 7-5 8.8-1.8-1.8-5-4.8-5-8.8v-5l5-1.5z"
            fill={creekNavy}
          />
        </svg>

        <h2
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: creekNavy }}
        >
          {title}
        </h2>
      </div>

      <div
        className="mt-2 h-1 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${creekRed}, ${creekNavy})`,
        }}
      />
    </div>
  );
}
