// src/components/home/TestimonialsSection.tsx
"use client";

import { motion, type Variants } from "framer-motion";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
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

export function TestimonialsSection({
  testimonials,
  creekRed,
  creekNavy,
}: TestimonialsSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader
        title="What people say"
        creekRed={creekRed}
        creekNavy={creekNavy}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-4 grid gap-5 md:grid-cols-3"
      >
        {testimonials.map((t, i) => (
          <QuoteCard
            key={`${t.name}-${i}`}
            quote={t.quote}
            name={t.name}
            role={t.role}
            altColor={i === 1}
            creekRed={creekRed}
            creekNavy={creekNavy}
          />
        ))}
      </motion.div>
    </section>
  );
}

function QuoteCard({
  quote,
  name,
  role,
  altColor = false,
  creekRed,
  creekNavy,
}: {
  quote: string;
  name: string;
  role: string;
  altColor?: boolean;
  creekRed: string;
  creekNavy: string;
}) {
  const color = altColor ? creekNavy : creekRed;

  return (
    <motion.blockquote
      variants={fadeUp}
      whileHover={{ y: -6, rotate: -0.2 }}
      whileTap={{ scale: 0.985 }}
      className="relative rounded-2xl border bg-white p-5 pr-6 shadow-sm will-change-transform hover:shadow-lg"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* quote bubble */}
      <motion.span
        layout
        className="absolute -top-3 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-white"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        “
      </motion.span>

      {/* tiny accent dot */}
      <span
        className="absolute -left-2 top-6 h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <p className="mt-1 text-gray-800">“{quote}”</p>

      <footer className="mt-4 text-sm text-gray-600">
        <span className="font-semibold" style={{ color: creekNavy }}>
          {name}
        </span>{" "}
        • {role}
      </footer>
    </motion.blockquote>
  );
}

/* ---------- Section Header (local copy) ---------- */

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
