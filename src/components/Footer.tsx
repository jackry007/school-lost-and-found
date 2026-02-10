"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Clock, Mail, MapPin, ChevronUp } from "lucide-react";

import logo from "../../public/images/cherry-creek-logo.png";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

export default function Footer() {
  const year = useMemo(() => new Date().getFullYear(), []);

  const helpLinks = [
    ["FAQ", "/faq"],
    ["Help Center", "/help"],
    ["Accessibility", "/accessibility"],
    ["Contact", "/contact"],
  ] as const;

  const policyLinks = [
    ["Privacy", "/privacy"],
    ["Terms of Use", "/terms"],
    ["Safety & Reporting", "/safety"],
  ] as const;

  return (
    <footer
      className="mt-16 border-t border-black/10 bg-white text-gray-700 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-200"
      aria-label="Site footer"
      id="site-footer"
    >
      {/* Accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Modern “app card” container */}
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
          {/* Top area */}
          <div className="grid gap-6 md:grid-cols-[1.35fr_1fr] md:items-start">
            {/* Brand block */}
            <section aria-labelledby="footer-branding">
              <h2 id="footer-branding" className="sr-only">
                About this site
              </h2>

              <div className="flex items-start gap-4">
                <Link
                  href="/"
                  className="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
                  style={{ ["--tw-ring-color" as any]: "rgba(11,44,92,.45)" }}
                  aria-label="Go to homepage"
                >
                  <Image
                    src={logo}
                    alt="Cherry Creek High School logo"
                    width={96}
                    height={96}
                    className="h-16 w-16 rounded-2xl border border-black/10 bg-white object-contain dark:border-white/10 sm:h-20 sm:w-20"
                    priority
                  />
                </Link>

                <div className="min-w-0">
                  <p className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-lg">
                    Cherry Creek HS — Lost &amp; Found
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-neutral-300">
                    Find or return lost items quickly and securely.
                  </p>

                  {/* Info chips */}
                  <div className="mt-4 grid gap-2">
                    <div className="flex items-start gap-2 rounded-2xl border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
                      <Clock
                        size={16}
                        className="mt-0.5 opacity-80"
                        aria-hidden="true"
                      />
                      <span className="leading-snug">
                        <span className="font-semibold">Pickup:</span> Main
                        Office · Mon–Fri, 7:30a–3:30p
                      </span>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
                      <MapPin
                        size={16}
                        className="mt-0.5 opacity-80"
                        aria-hidden="true"
                      />
                      <span className="leading-snug">
                        <span className="font-semibold">Location:</span> Cherry
                        Creek High School
                      </span>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
                      <Mail
                        size={16}
                        className="mt-0.5 opacity-80"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 leading-snug">
                        <span className="font-semibold">Contact:</span>{" "}
                        <Link
                          href="mailto:lostfound@cherrycreekschools.org"
                          className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950 rounded"
                        >
                          lostfound@cherrycreekschools.org
                        </Link>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Link panels */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              {/* Help card */}
              <nav
                aria-labelledby="footer-help"
                className="rounded-2xl border border-black/10 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <h2
                  id="footer-help"
                  className="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Help
                </h2>
                <ul className="mt-3 space-y-1">
                  {helpLinks.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white hover:text-gray-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
                      >
                        <span>{label}</span>
                        <ArrowUpRight
                          size={14}
                          className="opacity-50 group-hover:opacity-80 transition-opacity"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Policies card */}
              <nav
                aria-labelledby="footer-policies"
                className="rounded-2xl border border-black/10 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <h2
                  id="footer-policies"
                  className="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Policies
                </h2>
                <ul className="mt-3 space-y-1">
                  {policyLinks.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-800 hover:bg-white hover:text-gray-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
                      >
                        <span>{label}</span>
                        <ArrowUpRight
                          size={14}
                          className="opacity-50 group-hover:opacity-80 transition-opacity"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Divider */}
          <div
            className="my-6 h-px w-full bg-gray-200 dark:bg-white/10"
            aria-hidden="true"
          />

          {/* Bottom actions */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <nav aria-label="Footer quick actions" className="text-sm">
              <ul className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <li>
                  <Link
                    href="/report"
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
                    style={{
                      backgroundColor: CREEK_RED,
                      ["--tw-ring-color" as any]: "rgba(191,30,46,.55)",
                    }}
                  >
                    Report Found Item
                  </Link>
                </li>

                <li>
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border border-black/10 bg-white hover:bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
                  >
                    Browse Items
                  </Link>
                </li>

                <li>
                  <a
                    href="#top"
                    className="inline-flex items-center gap-2 justify-center rounded-full px-4 py-2 text-sm font-semibold underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
                  >
                    Back to top <ChevronUp size={16} aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </nav>

            <p className="w-full text-center text-xs text-gray-500 dark:text-neutral-400 md:w-auto md:text-right">
              © {year} Cherry Creek High School. All rights reserved.
            </p>
          </div>
        </div>

        {/* Tiny “subtle” hint bar below card */}
        <div className="mt-4 text-center text-xs text-gray-400 dark:text-neutral-500">
          Lost something? Check the main office first — items move fast.
        </div>
      </div>

      {/* JSON-LD (optional) */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Cherry Creek High School Lost & Found",
            email: "lostfound@cherrycreekschools.org",
            logo: "/images/cherry-creek-logo.png",
          }),
        }}
      />
    </footer>
  );
}
