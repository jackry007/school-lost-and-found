"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";
const NAVY_DARKMODE = "#1E407A"; // slightly brighter for dark contrast

export default function Footer() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const ringColor = `color-mix(in oklab, ${CREEK_NAVY} 88%, white)`;

  return (
    <footer
      className="mt-16 border-t border-black/10 bg-white text-gray-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
      aria-label="Site footer"
    >
      {/* Gradient accent */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg,#BF1E2E 0%,#0B2C5C 100%)" }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr] md:items-start">
          {/* Brand + contact */}
          <section aria-labelledby="footer-branding">
            <h2 id="footer-branding" className="sr-only">
              About this site
            </h2>
            <div className="flex items-start gap-4">
              <Link
                href="/"
                className="shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ ["--tw-ring-color" as any]: ringColor }}
              >
                <Image
                  src="/images/cherry-creek-logo.png"
                  alt="Cherry Creek High School logo"
                  width={88}
                  height={88}
                  className="h-22 w-22 rounded-md"
                  priority
                />
              </Link>

              <div className="max-w-prose">
                <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Cherry Creek HS — Lost &amp; Found
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                  Find or return lost items quickly and securely.
                </p>

                {/* Definition list = better semantics */}
                <dl className="mt-3 text-sm">
                  <div className="mt-1">
                    <dt className="inline font-medium">Pickup:</dt>{" "}
                    <dd className="inline">
                      Main Office · Mon–Fri, 7:30a–3:30p
                    </dd>
                  </div>
                  <div className="mt-1">
                    <dt className="inline font-medium">Contact:</dt>{" "}
                    <dd className="inline">
                      <Link
                        href="mailto:lostfound@cherrycreekschools.org"
                        className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md"
                        style={{ ["--tw-ring-color" as any]: ringColor }}
                      >
                        lostfound@cherrycreekschools.org
                      </Link>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Help */}
          <nav aria-labelledby="footer-help" className="text-sm">
            <h2
              id="footer-help"
              className="font-semibold text-gray-900 dark:text-white"
            >
              Help
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                ["FAQ", "/faq"],
                ["Help Center", "/help"],
                ["Accessibility", "/accessibility"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 underline-offset-2 hover:underline"
                    style={{
                      ["--tw-ring-color" as any]: ringColor,
                      color: "oklch(35% 0.06 255)",
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Policies */}
          <nav aria-labelledby="footer-policies" className="text-sm">
            <h2
              id="footer-policies"
              className="font-semibold text-gray-900 dark:text-white"
            >
              Policies
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                ["Privacy", "/privacy"],
                ["Terms of Use", "/terms"],
                ["Safety & Reporting", "/safety"],
                ["Sitemap", "/sitemap"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 underline-offset-2 hover:underline"
                    style={{ ["--tw-ring-color" as any]: ringColor }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div
          className="my-8 h-px w-full bg-gray-200 dark:bg-neutral-800"
          aria-hidden="true"
        />

        {/* Utility row */}
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <nav aria-label="Footer quick actions" className="text-sm">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <li>
                <Link
                  href="/report"
                  className="rounded-md px-3 py-1.5 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: CREEK_RED,
                    ["--tw-ring-color" as any]: ringColor,
                  }}
                >
                  Report Found Item
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="rounded-md underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ ["--tw-ring-color" as any]: ringColor }}
                >
                  Browse Items
                </Link>
              </li>
              <li
                aria-hidden
                className="h-5 w-px bg-gray-300 dark:bg-neutral-700"
              />
              <li>
                <a
                  href="#top"
                  className="rounded-md underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ ["--tw-ring-color" as any]: ringColor }}
                >
                  Back to top
                </a>
              </li>
            </ul>
          </nav>

          <p className="text-xs text-gray-500 dark:text-neutral-500">
            © {year} Cherry Creek High School. All rights reserved.
          </p>
        </div>
      </div>

      {/* JSON-LD: Organization (optional tiny SEO boost) */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Cherry Creek High School Lost & Found",
            email: "lostfound@cherrycreekschools.org",
            url: "https://your-domain.example", // update
            logo: "/images/cherry-creek-logo.png",
          }),
        }}
      />
      <style jsx global>{`
        /* Slightly brighter link color in dark mode for contrast */
        @media (prefers-color-scheme: dark) {
          footer a {
            color: ${NAVY_DARKMODE};
          }
          footer a:hover {
            color: ${NAVY_DARKMODE};
            text-decoration: underline;
          }
        }
      `}</style>
    </footer>
  );
}
