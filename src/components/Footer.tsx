"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

export default function Footer() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer
      className="mt-16 border-t border-black/10 bg-white text-gray-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
      aria-label="Site footer"
    >
      {/* Top band */}
      <div
        className="h-1 w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(191,30,46,1) 0%, rgba(11,44,92,1) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          {/* Branding + contact */}
          <div className="flex items-start gap-4">
            <Link
              href="/"
              className="shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring)] rounded-lg"
              style={{ ["--ring" as any]: CREEK_RED }}
            >
              <Image
                src="/images/cherry-creek-logo.png"
                alt="Cherry Creek High School logo"
                width={72}
                height={72}
                className="h-16 w-16 rounded-md"
              />
            </Link>

            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                Cherry Creek High School — Lost &amp; Found
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                Find or return lost items quickly and securely.
              </p>

              {/* Contact */}
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Pickup:</span> Main Office ·
                  Mon–Fri, 7:30a–3:30p
                </p>
                <p>
                  <span className="font-medium">Contact:</span>{" "}
                  <Link
                    href="mailto:lostfound@cherrycreekschools.org"
                    className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md"
                    style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
                  >
                    lostfound@cherrycreekschools.org
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Actions / Language */}
          <div className="flex w-full flex-col items-start gap-3 md:items-end">
            <nav aria-label="Footer links" className="text-sm">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-gray-900 dark:hover:text-white underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md"
                    style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
                  >
                    Help
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-gray-900 dark:hover:text-white underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md"
                    style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-gray-900 dark:hover:text-white underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md"
                    style={{ ["--tw-ring-color" as any]: CREEK_NAVY }}
                  >
                    Terms
                  </Link>
                </li>
                <li
                  className="h-5 w-px bg-gray-300 dark:bg-neutral-700"
                  aria-hidden="true"
                />

              </ul>
            </nav>

            {/* Small print */}
            <p className="text-xs text-gray-500 dark:text-neutral-500">
              © {year} Cherry Creek High School. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
