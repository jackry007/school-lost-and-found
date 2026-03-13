// src/components/home/StoriesSection.tsx
"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

export type Story = {
  icon: string;
  title: string;
  blurb: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type StoriesSectionProps = {
  stories: Story[];
  goProtected: (href: string) => void;
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

export function StoriesSection({
  stories,
  goProtected,
  creekRed,
  creekNavy,
}: StoriesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
      <SectionHeader
        title="Success stories"
        kicker="Real wins"
        creekRed={creekRed}
        creekNavy={creekNavy}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-4 grid gap-4 sm:gap-5 md:grid-cols-3"
      >
        {stories.map((s) => (
          <CaseFile
            key={s.title}
            {...s}
            goProtected={goProtected}
            creekRed={creekRed}
            creekNavy={creekNavy}
          />
        ))}
      </motion.div>
    </section>
  );
}

function CaseFile({
  icon,
  title,
  blurb,
  ctaLabel,
  ctaHref,
  goProtected,
  creekRed,
  creekNavy,
}: Story & {
  goProtected: (href: string) => void;
  creekRed: string;
  creekNavy: string;
}) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className="group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm will-change-transform hover:shadow-lg sm:p-5"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* animated left stripe */}
      <motion.span
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: creekRed }}
        initial={{ y: "100%" }}
        whileHover={{ y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        aria-hidden="true"
      />

      <div className="flex items-center gap-3">
        <div className="text-xl sm:text-2xl" aria-hidden="true">
          {icon}
        </div>

        <h3
          className="text-sm font-semibold sm:text-base"
          style={{ color: creekNavy }}
        >
          {title}
        </h3>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-gray-700">{blurb}</p>

      {ctaHref && (
        <Link
          href={ctaHref}
          onClick={(e) => {
            e.preventDefault();
            goProtected(ctaHref);
          }}
          className="mt-4 inline-block text-sm font-medium underline underline-offset-2"
          style={{ color: creekRed }}
        >
          {ctaLabel ?? "Learn more"}
        </Link>
      )}
    </motion.article>
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
    <div className="mb-4 sm:mb-5">
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
          className="text-xl font-extrabold tracking-tight sm:text-3xl"
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
