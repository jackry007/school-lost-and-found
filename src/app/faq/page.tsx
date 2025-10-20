"use client";

// Cherry Creek HS — Lost & Found • FAQ (animated, refined, slowed)
// - Two-column layout (FAQs + on-page index)
// - Brand ribbon + big headline
// - Animated accordion cards with rotating chevrons
// - Strong focus states, dark-mode friendly
// - FAQPage JSON-LD preserved
// - Micro-interactions: hover-lift, list stagger, scroll progress, active TOC
// - Reduced-motion friendly
// - Slower timings so users can see the motion

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useScroll,
  useSpring,
} from "framer-motion";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* ---------- Animation constants (slower) ---------- */
const easeOutExpo = [0.22, 1, 0.36, 1] as const;
const SLOW_DURATION = 1.0; // general fades/slides
const STAGGER = 0.12; // list reveal spacing
const SPRING_SLOW = { type: "spring", stiffness: 220, damping: 28 } as const;

type Faq = { id: string; q: string; a: React.ReactNode };

/* ---------- Framer helpers ---------- */
const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: STAGGER },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: SLOW_DURATION, ease: easeOutExpo },
  },
};

/* --------------------------------- QA card -------------------------------- */
function QA({ q, a, id }: Faq) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      id={id}
      className="group relative rounded-2xl border border-gray-200 bg-white/95 p-0 shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-900/95"
      style={{ scrollMarginTop: "6rem" }}
      whileHover={{ y: -3 }}
      transition={SPRING_SLOW}
    >
      {/* Header button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-content`}
        className="flex w-full cursor-pointer items-start gap-3 rounded-2xl px-4 py-4 text-left sm:px-5 sm:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
      >
        {/* Q badge */}
        <span
          aria-hidden
          className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow"
          style={{ backgroundColor: CREEK_RED }}
        >
          Q
        </span>

        {/* Question */}
        <h3 className="flex-1 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          {q}
        </h3>

        {/* Chevron */}
        <motion.svg
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.9, ease: easeOutExpo }}
          className="ml-auto mt-0.5 h-5 w-5 shrink-0 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.127l3.71-3.896a.75.75 0 111.08 1.04l-4.24 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </motion.svg>
      </button>

      {/* Animated content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            layout
            id={`${id}-content`}
            key="content"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 1.1, ease: easeOutExpo }}
          >
            <div className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
              <div className="border-t border-dashed border-gray-200 pt-4 text-[15px] leading-7 text-gray-700 dark:border-neutral-800 dark:text-neutral-200">
                {a}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active accent bar */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.7 }}
        style={{ backgroundColor: CREEK_RED }}
      />
    </motion.div>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function FAQPage() {
  /* Scroll progress bar (slower spring for smoother feel) */
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 12,
    mass: 0.4,
  });

  const faqs: Faq[] = useMemo(
    () => [
      {
        id: "report-found",
        q: "How do I report a found item?",
        a: (
          <>
            Click{" "}
            <Link href="/report" className="underline">
              Report Found Item
            </Link>
            , add a clear photo, where you found it, and unique details (e.g.,
            sticker, color). New submissions are reviewed by an admin before
            being listed.
          </>
        ),
      },
      {
        id: "claim-verify",
        q: "How are claims verified?",
        a: (
          <>
            Owners confirm a detail only they should know (engraving, case
            color, lock code) and show a student/staff ID at pickup. For safety,
            sensitive items (IDs, meds) are not publicly listed and are handled
            directly by staff.
          </>
        ),
      },
      {
        id: "pickup-times",
        q: "Where and when is pickup?",
        a: (
          <>
            <strong>Location:</strong> Main Office. <strong>Hours:</strong>{" "}
            Mon–Fri, 7:30a–3:30p. Bring your ID. If you can’t make those hours,
            use the{" "}
            <Link href="/contact" className="underline">
              Contact
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        id: "timeline",
        q: "How long are items kept?",
        a: (
          <>
            Items are held up to <strong>30 days</strong>. After that, they may
            be donated or recycled per school policy.
          </>
        ),
      },
      {
        id: "edit-report",
        q: "Can I edit or remove a report I submitted?",
        a: (
          <>
            Yes. If you posted while signed in, you can edit from your
            dashboard. Otherwise, request a change via the{" "}
            <Link href="/contact" className="underline">
              Contact
            </Link>{" "}
            page (include the item link or ID).
          </>
        ),
      },
      {
        id: "photo-tips",
        q: "Any tips for good photos and descriptions?",
        a: (
          <ul className="list-disc pl-5">
            <li>Use a plain background with good lighting.</li>
            <li>
              Include one close-up of a unique feature (sticker, initials).
            </li>
            <li>Keep personal info out of photos/descriptions.</li>
          </ul>
        ),
      },
      {
        id: "moderation",
        q: "What gets reviewed or removed?",
        a: (
          <>
            We may decline or remove listings that are misleading, unsafe, or
            contain sensitive personal information. See{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/safety" className="underline">
              Safety &amp; Reporting
            </Link>
            .
          </>
        ),
      },
      {
        id: "privacy",
        q: "What data do you collect and why?",
        a: (
          <>
            We store item details/photos, timestamps, and (for signed-in users)
            your school email/UID to run the service, prevent abuse, and verify
            claims. See the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </>
        ),
      },
      {
        id: "accessibility",
        q: "Accessibility and accommodations",
        a: (
          <>
            We aim for WCAG 2.1 AA. If you encounter barriers, email the address
            on our{" "}
            <Link href="/accessibility" className="underline">
              Accessibility
            </Link>{" "}
            page. We typically respond within 3 school days.
          </>
        ),
      },
      {
        id: "browse",
        q: "Where can I browse current items?",
        a: (
          <>
            Start at{" "}
            <Link href="/search" className="underline">
              Browse Items
            </Link>{" "}
            and filter by category or date.
          </>
        ),
      },
    ],
    []
  );

  /* Active TOC tracking via IntersectionObserver */
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 1],
      }
    );

    faqs.forEach((f) => {
      const el = document.getElementById(f.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [faqs]);

  return (
    <MotionConfig reducedMotion="user">
      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-40 h-0.5 origin-left"
        style={{
          background: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
          scaleX: progress,
        }}
      />

      <div
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        style={{
          background:
            "radial-gradient(rgba(11,44,92,0.035) 1px, transparent 1px) 0 0 / 18px 18px",
        }}
      >
        {/* Header */}
        <header className="mb-8">
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow"
            style={{ backgroundColor: CREEK_NAVY }}
          >
            Cherry Creek
          </span>
          <h1
            className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            Frequently Asked Questions
          </h1>
          <motion.div
            className="mt-3 h-1 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, ease: easeOutExpo }}
            style={{
              transformOrigin: "left",
              background: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
            }}
          />
          <motion.p
            className="mt-3 text-sm text-gray-600 dark:text-neutral-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: easeOutExpo }}
          >
            Can’t find your answer? Visit the{" "}
            <Link href="/help" className="underline">
              Help Center
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="underline">
              Contact
            </Link>{" "}
            us.
          </motion.p>
        </header>

        {/* Content grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left: FAQs */}
          <main>
            <motion.div
              variants={listVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-4"
            >
              {faqs.map((f) => (
                <motion.div key={f.id} variants={itemVariants}>
                  <QA {...f} />
                </motion.div>
              ))}
            </motion.div>

            {/* Quick actions */}
            <section className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="rounded-md px-4 py-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: CREEK_RED,
                  ["--tw-ring-color" as any]: CREEK_NAVY,
                }}
              >
                Report Found Item
              </Link>
              <Link
                href="/search"
                className="rounded-md underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
              >
                Browse Items
              </Link>
            </section>
          </main>

          {/* Right: On-page index */}
          <aside
            aria-label="On-page navigation"
            className="lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]"
          >
            <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                On this page
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {faqs.map((f) => {
                  const active = activeId === f.id;
                  return (
                    <li key={f.id}>
                      <a
                        href={`#${f.id}`}
                        className={`block rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          active
                            ? "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white"
                            : "text-gray-700 dark:text-neutral-200"
                        }`}
                        style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
                      >
                        {f.q}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div
              className="mt-4 rounded-xl border bg-white/70 p-3 text-xs text-gray-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-300"
              style={{ borderColor: "rgba(0,0,0,0.06)" }}
            >
              <p>
                Tip: use <kbd className="rounded border px-1">Ctrl</kbd>/
                <kbd className="rounded border px-1">⌘</kbd>+
                <kbd className="rounded border px-1">F</kbd> to find a keyword.
              </p>
            </div>
          </aside>
        </div>

        {/* JSON-LD for rich results */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.slice(0, 8).map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: getTextFromReactNode(f.a),
                },
              })),
            }),
          }}
        />
      </div>
    </MotionConfig>
  );
}

/* Stringify React node → text for JSON-LD */
function getTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getTextFromReactNode).join(" ");
  if (!node || typeof node !== "object") return "";
  const anyNode = node as any;
  if (anyNode.props?.children)
    return getTextFromReactNode(anyNode.props.children);
  return "";
}
