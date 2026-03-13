"use client";

import { motion, type Variants } from "framer-motion";

type MissionSectionProps = {
  base: string;
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

const HOVER_SPRING = { type: "spring", stiffness: 220, damping: 28 } as const;

export function MissionSection({
  base,
  creekRed,
  creekNavy,
}: MissionSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <SectionHeader
        title="Our Mission"
        kicker="Cherry Creek"
        creekRed={creekRed}
        creekNavy={creekNavy}
      />

      <PaperGrid creekNavy={creekNavy}>
        <div className="grid items-start gap-8 md:grid-cols-2">
          {/* TEXT SIDE */}
          <div>
            <p className="text-base sm:text-lg leading-relaxed text-gray-700">
              We help students and staff reunite with their belongings quickly
              and safely. With simple tech and community cooperation, we reduce
              stress, waste, and time spent searching—one backpack at a time.
            </p>

            <motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[
                {
                  icon: "⚡",
                  title: "Fast",
                  desc: "Report or search in seconds.",
                },
                {
                  icon: "✅",
                  title: "Fair",
                  desc: "Clear, verified claims.",
                },
                {
                  icon: "🔐",
                  title: "Secure",
                  desc: "Photos & records safe.",
                },
              ].map((f) => (
                <motion.li
                  key={f.title}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.985 }}
                  transition={HOVER_SPRING}
                  className="rounded-2xl bg-white p-3 sm:p-4 text-center shadow-sm hover:shadow-lg"
                >
                  <div
                    className="mx-auto flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-base sm:text-lg"
                    style={{
                      backgroundColor: `${creekRed}1A`,
                      color: creekRed,
                    }}
                  >
                    {f.icon}
                  </div>

                  <div
                    className="mt-2 text-sm sm:text-base font-semibold"
                    style={{ color: creekNavy }}
                  >
                    {f.title}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-snug">
                    {f.desc}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* IMAGE SIDE */}
          <div className="relative w-full">
            <div className="rounded-2xl border bg-white p-2 shadow-md">
              <motion.img
                src={`${base}/images/LostBackpack.png`}
                alt="Students reuniting with a backpack"
                className="h-52 sm:h-64 md:h-72 w-full rounded-xl object-cover"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.8, ease: easeOutQuint }}
              />
            </div>

            <p className="mt-3 text-center text-sm text-gray-500">
              Pickup: Main Office • Mon–Fri, 7:30a–3:30p
            </p>
          </div>
        </div>
      </PaperGrid>
    </section>
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
        <svg width="28" height="32" viewBox="0 0 24 28">
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

/* ---------- Paper Grid ---------- */

function PaperGrid({
  children,
  creekNavy,
}: {
  children: React.ReactNode;
  creekNavy: string;
}) {
  const dot = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${creekNavy}22'/></svg>`,
  );

  return (
    <div
      className="rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[0_10px_30px_rgba(0,0,0,.05)]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${dot}")`,
        backgroundColor: "#fafbff",
      }}
    >
      {children}
    </div>
  );
}
