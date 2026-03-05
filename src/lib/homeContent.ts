// src/lib/homeContent.ts
// --------------------------------------------------
// Static content for the homepage
// Cherry Creek Lost & Found
// --------------------------------------------------

/* ---------- Testimonials ---------- */

export const TESTIMONIALS = [
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

/* ---------- Success Stories ---------- */

export const STORIES = [
  {
    icon: "🎧",
    title: "AirPods reunited in 24 hours",
    blurb:
      "Found after practice; the owner matched a sticker detail and picked them up the next day.",
    ctaLabel: "Browse electronics",
    ctaHref: "/search?category=Electronics",
  },
  {
    icon: "🎒",
    title: "Backpack saved from the rain",
    blurb:
      "Custodial staff logged a courtyard bag; a schedule sheet inside confirmed ownership.",
    ctaLabel: "See backpacks",
    ctaHref: "/search?category=Bags",
  },
  {
    icon: "🪪",
    title: "ID returned before 1st period",
    blurb:
      "An early report and office pickup avoided a replacement fee and a tardy.",
    ctaLabel: "View IDs & Cards",
    ctaHref: "/search?category=IDs%20%2F%20Cards",
  },
];

/* ---------- Mission Features ---------- */

export const MISSION_FEATURES = [
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
    desc: "Photos and records are safely stored.",
  },
];
