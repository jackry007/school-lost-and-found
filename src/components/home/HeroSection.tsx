// src/components/home/HeroSection.tsx
"use client";

import { motion } from "framer-motion";

type HeroSectionProps = {
  base: string;
  creekRed: string;
  creekNavy: string;

  authLoading: boolean;
  isAuthed: boolean;

  onReport: () => void;
  onBrowse: () => void;
};

const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection({
  base,
  creekRed,
  creekNavy,
  authLoading,
  isAuthed,
  onReport,
  onBrowse,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[58vh] sm:min-h-[64vh] md:h-[520px] w-full overflow-hidden">
      <img
        src={`${base}/images/backpack-bench.jpg`}
        alt="A backpack left on a school bench"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,44,92,0.88) 0%, rgba(11,44,92,0.68) 42%, rgba(11,44,92,0.08) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-start sm:items-center px-4 sm:px-8 lg:px-10 pt-10 pb-24 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: easeOutQuint }}
          className="max-w-xl text-white"
        >
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            Cherry Creek Lost &amp; Found
          </h1>

          <p className="mt-3 max-w-md text-base text-white/95 sm:text-lg">
            Fast, fair, and secure—get belongings back where they belong.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <button
              type="button"
              disabled={authLoading}
              onClick={onReport}
              className="inline-flex h-[46px] w-full sm:w-auto items-center justify-center rounded-xl px-5 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: creekRed }}
            >
              Report Found Item
            </button>

            <button
              type="button"
              disabled={authLoading}
              onClick={onBrowse}
              className="inline-flex h-[46px] w-full sm:w-auto items-center justify-center rounded-xl border border-white/80 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ ["--tw-ring-color" as any]: creekNavy }}
            >
              {isAuthed ? "Browse Items" : "Sign in to Browse"}
            </button>
          </div>

          {!isAuthed && !authLoading && (
            <p className="mt-3 max-w-md text-xs sm:text-sm text-white/85">
              Tip: Signing in lets you see recently reported items.
            </p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1.0, ease: easeOutQuint }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 w-full sm:w-auto"
      >
        <div className="mx-auto inline-flex max-w-full items-center gap-2 sm:gap-3 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur">
          <span>🎒 Leave it.</span>
          <span>📝 Log it.</span>
          <span>🔎 Find it.</span>
        </div>
      </motion.div>
    </section>
  );
}
