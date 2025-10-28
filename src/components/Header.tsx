"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

// Persist when the banner may show again
const NOTICE_NEXT_SHOW_KEY = "cc-lostfound-notice:nextShowAt:v1";
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const nav = [
  { href: "/", label: "Lost & Found" },
  { href: "/report", label: "Report Found Item" },
  { href: "/admin", label: "Admin" },
];

function shouldShowNoticeNow(): boolean {
  if (typeof window === "undefined") return false; // don't render on server to avoid mismatch
  const raw = window.localStorage.getItem(NOTICE_NEXT_SHOW_KEY);
  if (!raw) return true; // never dismissed -> show
  const nextShowAt = parseInt(raw, 10) || 0;
  return Date.now() >= nextShowAt; // show only if we're past the next-show time
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // null = not decided yet; avoids initial flash
  const [showNotice, setShowNotice] = useState<null | boolean>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Decide visibility on mount (client-only) to prevent flicker
  useEffect(() => {
    setShowNotice(shouldShowNoticeNow());
  }, []);

  return (
    <>
      {/* Top Bar (glass + gradient + shrink on scroll) */}
      <header
        className={[
          "sticky top-0 z-40 text-white transition-all duration-300",
          scrolled
            ? "shadow-[0_6px_18px_rgba(0,0,0,.18)]"
            : "shadow-[0_10px_28px_rgba(0,0,0,.12)]",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(180deg, rgba(191,30,46,0.96) 0%, rgba(168,21,36,0.96) 100%)",
          backdropFilter: "saturate(120%) blur(6px)",
          WebkitBackdropFilter: "saturate(120%) blur(6px)",
          borderBottom: "1px solid rgba(0,0,0,.18)",
        }}
      >
        <div
          className={[
            "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
            scrolled ? "h-14" : "h-16",
          ].join(" ")}
        >
          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-7">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-lg px-2 py-1 transition no-underline decoration-0"
              style={{ textDecoration: "none" }}
              aria-label="Cherry Creek Lost & Found Home"
            >
              <span className="text-2xl leading-none">🎒</span>
              <div className="leading-tight">
                <div className="text-[16px] font-extrabold tracking-tight">
                  Cherry Creek
                </div>
                <div className="text-[12px] font-medium text-white/90">
                  Lost &amp; Found
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              {nav.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative group rounded-full px-4 py-2 text-sm font-semibold transition no-underline decoration-0",
                      active
                        ? "bg-yellow-400 text-red-900 shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]"
                        : "text-white/90 hover:bg-white/15 hover:text-white",
                    ].join(" ")}
                    style={{ textDecoration: "none" }}
                  >
                    {n.label}
                    <span
                      className={[
                        "pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-1 h-[3px] w-10 rounded-full transition-all",
                        active
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100",
                      ].join(" ")}
                      style={{
                        backgroundColor: active
                          ? "#6E0F16"
                          : "rgba(255,255,255,.9)",
                      }}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search (glass chip) */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                "border border-white/30 bg-white/10",
                "hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/60",
                "transition shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]",
              ].join(" ")}
              style={{ textDecoration: "none" }}
              aria-label="Search items"
              title="Search items"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </Link>
          </div>
        </div>

        {/* Navy keyline for contrast */}
        <div
          className="h-0.5 w-full"
          style={{ backgroundColor: `${CREEK_NAVY}EE` }}
        />
      </header>

      {/* Creek Ribbon */}
      <div
        className="h-8 w-full shadow-[inset_0_-1px_0_rgba(0,0,0,.08)]"
        style={{
          background:
            "repeating-linear-gradient(135deg, #BF1E2E 0 16px, #0B2C5C 16px 32px)",
        }}
      />

      {/* ⚠️ Dismissible Notice — no flash, reappears after 1 day */}
      {showNotice === true && (
        <div
          role="region"
          aria-label="Important notice"
          className={[
            "relative bg-yellow-50 border-y border-yellow-200",
            "text-center text-sm sm:text-base text-yellow-900",
            "py-2 pl-4 pr-12 shadow-sm",
            "transition-opacity duration-300 ease-out",
          ].join(" ")}
        >
          ⚠️ <span className="font-semibold">Important Notice:</span> Items
          unclaimed after <strong>60 days</strong> may be donated or disposed of
          according to school policy.
          <button
            type="button"
            aria-label="Dismiss important notice"
            onClick={() => {
              setShowNotice(false);
              try {
                window.localStorage.setItem(
                  NOTICE_NEXT_SHOW_KEY,
                  String(Date.now() + ONE_DAY_MS)
                );
              } catch {}
            }}
            className={[
              "absolute right-2 top-1/2 -translate-y-1/2",
              "inline-flex items-center justify-center",
              "rounded-md p-2",
              "text-yellow-900/80 hover:text-yellow-900",
              "hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/60",
              "transition",
            ].join(" ")}
            title="Dismiss"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
