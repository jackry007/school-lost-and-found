// src/app/page.tsx
// ------------------------------------------------------
// Cherry Creek HS Lost & Found — CCHS-branded
// Hero + Mission + Stats + Testimonials + Stories
// With PageShell background, Creek ribbon, denser grids.
// ------------------------------------------------------

"use client";
import { BASE } from "@/lib/basePath";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

import { ItemCard } from "@/components/ItemCard";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Types ---------- */
type CardItem = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  thumb: string;
};

const BUCKET = "item-photos";
const FALLBACK_THUMB = `${BASE}/no-image.png`; // <— changed

/* ---------- Brand tokens ---------- */
const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* ---------- Anim variants ---------- */
const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: easeOutQuint },
  },
};

const stagger: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

/* ---------- Page ---------- */
export default function HomePage() {
  const [items, setItems] = useState<CardItem[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .schema("public")
        .from("items")
        .select(
          "id, title, location, category, date_found, photo_url, status"
        )
        .order("date_found", { ascending: false })
        .limit(8); // (#8) denser "Recently Reported"

      if (error) {
        setErrMsg(error.message);
        return;
      }

      const mapped: CardItem[] = (data ?? []).map((row: any) => {
        let thumb = FALLBACK_THUMB;
        const path: string | null = row.photo_url ?? null;
        if (path) {
          if (/^https?:\/\//i.test(path)) {
            thumb = path;
          } else {
            const { data: urlData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(path);
            thumb = urlData?.publicUrl || FALLBACK_THUMB;
          }
        }
        return {
          id: String(row.id),
          title: String(row.title ?? "Untitled"),
          location: String(row.location ?? "—"),
          category: String(row.category ?? "Misc"),
          date: new Date(row.date_found).toISOString().slice(0, 10),
          thumb,
        };
      });

      setItems(mapped);
      setErrMsg(null);
    })();
  }, []);

  return (
    <CreekPageShell>
      {/* (#1) soft background wrapper */}
      {/* 🌄 HERO */}
      <section className="relative min-h-[68vh] md:h-[520px] w-full overflow-hidden">
        <img
          src={`${BASE}/images/backpack-bench.jpg`}
          alt="A backpack left on a school bench"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,44,92,0.85) 0%, rgba(11,44,92,0.6) 40%, rgba(11,44,92,0.0) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-white"
          >
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Cherry Creek Lost &amp; Found
            </h1>
            <p className="mt-3 text-white/95">
              Fast, fair, and secure—get belongings back where they belong.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md transition"
                style={{ backgroundColor: CREEK_RED }}
              >
                Report Found Item
              </Link>
              <Link
                href="/search"
                className="rounded-lg border border-white/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Items
              </Link>
            </div>
          </motion.div>
        </div>

        {/* tagline pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div className="mx-auto inline-flex items-center gap-3 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur">
            <span>🎒 Leave it.</span>
            <span>📝 Log it.</span>
            <span>🔎 Find it.</span>
          </div>
        </motion.div>
      </section>

      {/* (#2) Creek ribbon under hero */}
      <CreekRibbon />

      {errMsg && (
        <div className="mx-auto my-4 max-w-7xl rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
          Supabase error: {errMsg}
        </div>
      )}

      {/* ===== CCHS UNIQUE SECTIONS ===== */}
      <MissionSection />
      <StatsSection />
      <TestimonialsSection />
      <StoriesSection />

      {/* 📋 RECENTLY REPORTED */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {items.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-lg font-semibold"
                style={{ color: CREEK_NAVY }}
              >
                Recently Reported
              </h2>
              <Link
                href="/search"
                className="text-sm underline"
                style={{ color: CREEK_RED }}
              >
                View all
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((it) => (
                <li key={it.id}>
                  <ItemCard item={it} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <section className="grid place-items-center rounded-2xl border border-dashed border-gray-300 py-16">
            <div className="text-center">
              <p className="text-lg font-medium">No items yet</p>
              <p className="mt-1 text-sm text-gray-600">
                Be the first to add a found item so we can get it back to its
                owner.
              </p>
              <Link
                href="/report"
                className="mt-4 rounded-lg px-4 py-2 text-white"
                style={{ backgroundColor: CREEK_RED }}
              >
                Report an Item
              </Link>
            </div>
          </section>
        )}
      </main>
    </CreekPageShell>
  );
}

/* ===================== Unique Section Components ===================== */

function SectionHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="mb-5">
      {/* (#8) slightly tighter */}
      {kicker && (
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: CREEK_NAVY }}
        >
          {kicker}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3">
        <svg
          width="28"
          height="32"
          viewBox="0 0 24 28"
          aria-hidden
          className="drop-shadow-sm"
        >
          <path
            d="M12 0l10 4v8c0 7-5 12-10 16C7 24 2 19 2 12V4l10-4z"
            fill={CREEK_RED}
          />
          <path
            d="M12 3l7 2v6c0 5-4 9-7 12-3-3-7-7-7-12V5l7-2z"
            fill="white"
            opacity=".95"
          />
          <path
            d="M12 4.5l5 1.5v5c0 4-3.2 7-5 8.8-1.8-1.8-5-4.8-5-8.8v-5l5-1.5z"
            fill={CREEK_NAVY}
          />
        </svg>
        <h2
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: CREEK_NAVY }}
        >
          {title}
        </h2>
      </div>
      <div
        className="mt-2 h-1 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
        }}
      />
    </div>
  );
}

/* (#1) PageShell with subtle gradient + dot texture */
function CreekPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #0B2C5C0A 0%, #0B2C5C08 40%, #ffffff 100%)",
        backgroundImage:
          "radial-gradient(rgba(11,44,92,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
    </div>
  );
}

/* (#2) Creek ribbon (red/navy diagonal) */
function CreekRibbon() {
  return (
    <div
      className="h-8 w-full -mt-1 shadow-[inset_0_-1px_0_rgba(0,0,0,.08)]"
      style={{
        background:
          "repeating-linear-gradient(135deg,#BF1E2E 0 16px,#0B2C5C 16px 32px)",
      }}
    />
  );
}

function PaperGrid({ children }: { children: React.ReactNode }) {
  const dot = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='1' cy='1' r='1' fill='${CREEK_NAVY}22'/></svg>`
  );
  return (
    <div
      className="rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,.05)]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${dot}")`,
        backgroundColor: "#fafbff",
      }}
    >
      {children}
    </div>
  );
}

/* ----- Mission ----- */
function MissionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* (#8) py-14 -> py-10 */}
      <SectionHeader title="Our Mission" kicker="Cherry Creek" />
      <PaperGrid>
        <div className="grid items-start gap-8 md:grid-cols-2">
          {/* (#8) gap-10 -> gap-8 */}
          <div>
            <p className="text-lg leading-relaxed text-gray-700">
              We help students and staff reunite with their belongings quickly
              and safely. With simple tech and community cooperation, we reduce
              stress, waste, and time spent searching—one backpack at a time.
            </p>
            <motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-8 grid gap-4 sm:grid-cols-3"
            >
              {[
                {
                  icon: "⚡",
                  title: "Fast",
                  desc: "Report or search in seconds.",
                },
                { icon: "✅", title: "Fair", desc: "Clear, verified claims." },
                { icon: "🔐", title: "Secure", desc: "Photos & records safe." },
              ].map((f) => (
                <motion.li
                  key={f.title}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.985 }}
                  className="rounded-2xl bg-white p-4 text-center shadow-sm will-change-transform hover:shadow-lg"
                >
                  <div
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-lg"
                    style={{
                      backgroundColor: `${CREEK_RED}1A`,
                      color: CREEK_RED,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div
                    className="mt-2 font-semibold"
                    style={{ color: CREEK_NAVY }}
                  >
                    {f.title}
                  </div>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <div className="relative w-full">
            <div
              className="rounded-2xl border bg-white p-2 shadow-md"
              style={{ borderColor: "#E5E7EB" }}
            >
              <motion.img
                src={`${BASE}/images/LostBackpack.png`}
                alt="Students reuniting with a backpack at the office"
                className="h-72 w-full rounded-xl object-cover"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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

/* ----- Stats ----- */
function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* (#8) py-8 -> py-10 to balance bands */}
      <SectionHeader title="Program stats" kicker="At a glance" />
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <CreekStat icon="🧾" label="Total items logged" value="128" bar={88} />
        <CreekStat icon="🎉" label="Items reunited" value="96" bar={72} />
        <CreekStat icon="📆" label="Past 30 days" value="42" bar={40} />
        <CreekStat icon="📈" label="Claim rate" value="75%" bar={75} />
      </motion.div>
      <p className="mt-2 text-xs text-gray-500">
        *Demo figures shown for layout — replace with live stats later.
      </p>
    </section>
  );
}

function CreekStat({
  icon,
  label,
  value,
  bar = 70,
}: {
  icon: string;
  label: string;
  value: string | number;
  bar?: number;
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
          style={{ color: CREEK_NAVY }}
        >
          {value}
        </div>
      </div>
      <div className="mt-2 text-[12px] text-gray-600">{label}</div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: CREEK_RED }}
          initial={{ width: 0 }}
          whileInView={{ width: `${bar}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

/* ----- Testimonials ----- */
function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* (#8) py-12 -> py-10 */}
      <SectionHeader title="What people say" />
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-4 grid gap-5 md:grid-cols-3"
      >
        {TESTIMONIALS.map((t, i) => (
          <QuoteCard key={t.name} {...t} altColor={i === 1} />
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
}: {
  quote: string;
  name: string;
  role: string;
  altColor?: boolean;
}) {
  const color = altColor ? CREEK_NAVY : CREEK_RED;
  return (
    <motion.blockquote
      variants={fadeUp}
      whileHover={{ y: -6, rotate: -0.2 }}
      whileTap={{ scale: 0.985 }}
      className="relative rounded-2xl border bg-white p-5 pr-6 shadow-sm will-change-transform hover:shadow-lg"
      style={{ borderColor: "#E5E7EB" }}
    >
      <motion.span
        layout
        className="absolute -top-3 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-white"
        style={{ backgroundColor: color }}
      >
        “
      </motion.span>
      <span
        className="absolute -left-2 top-6 h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <p className="mt-1 text-gray-800">“{quote}”</p>
      <footer className="mt-4 text-sm text-gray-600">
        <span className="font-semibold" style={{ color: CREEK_NAVY }}>
          {name}
        </span>{" "}
        • {role}
      </footer>
    </motion.blockquote>
  );
}

/* ----- Success Stories ----- */
function StoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
      <SectionHeader title="Success stories" kicker="Real wins" />
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-4 grid gap-5 md:grid-cols-3"
      >
        {STORIES.map((s) => (
          <CaseFile key={s.title} {...s} />
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
}: {
  icon: string;
  title: string;
  blurb: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className="group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm will-change-transform hover:shadow-lg"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* animated red spine */}
      <motion.span
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: CREEK_RED }}
        initial={{ y: "100%" }}
        whileHover={{ y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      />
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <h3 className="font-semibold" style={{ color: CREEK_NAVY }}>
          {title}
        </h3>
      </div>
      <p className="mt-3 text-sm text-gray-700">{blurb}</p>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 inline-block text-sm font-medium underline"
          style={{ color: CREEK_RED }}
        >
          {ctaLabel}
        </Link>
      )}
    </motion.article>
  );
}

/* ---------- Static content ---------- */
const TESTIMONIALS = [
  {
    quote:
      "I found my AirPods in a day. The photos made it super easy to prove they were mine.",
    name: "Maya C.",
    role: "Student",
  },
  {
    quote:
      "Our office gets fewer interruptions now that everything is logged online.",
    name: "Mr. Ramirez",
    role: "Main Office",
  },
  {
    quote: "Fastest lost-and-found flow I’ve seen at a school.",
    name: "Coach L.",
    role: "Athletics",
  },
];

const STORIES = [
  {
    icon: "🎧",
    title: "AirPods reunited in 24 hours",
    blurb:
      "Found after practice; owner matched a sticker detail and picked them up next day.",
    ctaLabel: "Browse electronics",
    ctaHref: "/search?category=Electronics",
  },
  {
    icon: "🎒",
    title: "Backpack saved from the rain",
    blurb:
      "Custodial staff logged a courtyard bag; schedule sheet inside confirmed ownership.",
    ctaLabel: "See backpacks",
    ctaHref: "/search?category=Bags",
  },
  {
    icon: "🪪",
    title: "ID returned before 1st period",
    blurb: "Early report + office pickup avoided a replacement fee and tardy.",
    ctaLabel: "View IDs & Cards",
    ctaHref: "/search?category=IDs%20%2F%20Cards",
  },
];
