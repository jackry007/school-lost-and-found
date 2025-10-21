"use client";

// Cherry Creek HS — Lost & Found • FAQ (animated, refined, slowed)
// - Two-column layout (FAQs + important sidebar)
// - Brand ribbon + big headline
// - Animated accordion cards with rotating chevrons
// - Strong focus states, dark-mode friendly
// - FAQPage JSON-LD preserved (top 8 prioritized)
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
            <strong>Location:</strong> Security Office, located in the East
            Building. <strong>Hours:</strong> Mon–Fri, 7:30a–3:30p. Bring your
            ID. If you can’t make those hours, use the{" "}
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
            Items are held up to <strong>60 days</strong>. After that, they may
            be donated or recycled per school policy.
          </>
        ),
      },
      {
        id: "edit-report",
        q: "Can I edit or remove a report I submitted?",
        a: (
          <>
            You can’t directly edit or delete a report yourself. If you need to
            make a change, please contact the Lost &amp; Found staff using the{" "}
            <Link href="/contact" className="underline">
              Contact
            </Link>{" "}
            page and include your item link or description. A staff member will
            review and update it for you.
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
            We collect only the information needed to manage lost and found
            items — this includes photos, item details, and timestamps. When a
            claim is made, students or staff must show a school ID to verify
            ownership. No personal accounts or logins are used. For details, see
            the{" "}
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

      /* -------------------- High-value additions -------------------- */
      {
        id: "pending-review",
        q: "What does ‘Pending Review’ mean?",
        a: (
          <>
            Your submission is in the moderation queue so we can prevent spam
            and protect sensitive info. Reviews typically take{" "}
            <strong>1 school day</strong>. You’ll see it listed after approval.
          </>
        ),
      },
      {
        id: "device-found",
        q: "I found a phone/laptop—what should I do?",
        a: (
          <>
            Please <strong>do not</strong> post serial numbers or screen photos.
            Turn devices in to the <strong>Main Office </strong>
            immediately. We verify ownership at pickup (lock screen name, case
            details, etc.). Lost devices aren’t publicly listed.
          </>
        ),
      },
      {
        id: "sensitive-items",
        q: "Are IDs, meds, or keys listed publicly?",
        a: (
          <>
            No. <strong>Sensitive items</strong> (IDs, medications, credit
            cards, house/car keys) are held securely and handled by staff only.
            Use{" "}
            <Link href="/contact" className="underline">
              Contact
            </Link>{" "}
            if you’re looking for one.
          </>
        ),
      },
      {
        id: "prove-ownership",
        q: "How do I prove an item is mine without giving away clues?",
        a: (
          <>
            When submitting a claim, share <strong>partial/obscured </strong>
            details: the first/last letters of a name, a unique sticker’s theme,
            or a small scratch location—things not visible in photos.
          </>
        ),
      },
      {
        id: "false-claims",
        q: "What happens if someone falsely claims an item?",
        a: (
          <>
            Claims are verified in person using a school ID and any matching
            details about the item. For unique items, staff will ask about
            features only the real owner would know. For common items (like
            plain water bottles), staff rely on where and when it was lost or
            found, and use their judgment. If someone knowingly gives false
            information, staff may report it to school administration for
            follow-up.
          </>
        ),
      },
      {
        id: "after-60-days",
        q: "What happens after 60 days?",
        a: (
          <>
            Unclaimed items may be <strong>donated or recycled</strong> per
            school policy. Valuables are handled by staff with extended hold at
            their discretion. See also{" "}
            <a href="#timeline" className="underline">
              How long are items kept?
            </a>
          </>
        ),
      },
      {
        id: "not-upload",
        q: "What items should I not upload?",
        a: (
          <>
            Don’t upload photos of faces or private info, and do not post
            weapons/vapes, perishables, or unsafe items. Bring those to the
            <strong> Main Office</strong>—don’t post.
          </>
        ),
      },
      {
        id: "off-campus",
        q: "Can I report items found off-campus?",
        a: (
          <>
            We focus on <strong>on-campus</strong> finds. For off-campus
            locations, use that venue’s lost &amp; found. If it was at a school
            event, submit and note the event.
          </>
        ),
      },
      {
        id: "data-removal",
        q: "How do I remove my data?",
        a: (
          <>
            If you’d like a photo or report removed, please contact the Lost
            &amp; Found staff using the{" "}
            <Link href="/contact" className="underline">
              Contact
            </Link>{" "}
            page. Include the item details or link, and we’ll review and remove
            it if appropriate.
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

  /* Build the Top 8 for JSON-LD (rich results) */
  const jsonLdTop8Order = [
    "report-found",
    "claim-verify",
    "pickup-times",
    "timeline",
    "device-found",
    "sensitive-items",
    "pending-review",
    "not-upload",
  ];

  const jsonLdFaqs = faqs
    .filter((f) => jsonLdTop8Order.includes(f.id))
    .sort(
      (a, b) => jsonLdTop8Order.indexOf(a.id) - jsonLdTop8Order.indexOf(b.id)
    );

  /* Curated important questions (sidebar) */
  const importantIds = [
    "report-found",
    "claim-verify",
    "pickup-times",
    "timeline",
    "device-found",
    "sensitive-items",
    "not-upload",
  ];

  const importantFaqs = faqs
    .filter((f) => importantIds.includes(f.id))
    .sort((a, b) => importantIds.indexOf(a.id) - importantIds.indexOf(b.id));

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
            <section className="mt-8 flex flex-wrap items-center gap-3">
              {/* Primary (red) */}
              <Link
                href="/report"
                className="inline-flex h-[42px] items-center justify-center rounded-md px-4 text-sm font-semibold text-white shadow-sm transition no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: CREEK_RED,
                  ["--tw-ring-color" as any]: CREEK_NAVY,
                }}
              >
                Report Found Item
              </Link>

              {/* Secondary (outlined) */}
              <Link
                href="/search"
                className="inline-flex h-[42px] items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
                style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
              >
                Browse Items
              </Link>
            </section>
          </main>

          {/* Right: Important questions sidebar */}
          <aside
            aria-label="Important questions"
            className="lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]"
          >
            <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Important questions from the FAQ
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {importantFaqs.map((f) => {
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
              mainEntity: jsonLdFaqs.map((f) => ({
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
