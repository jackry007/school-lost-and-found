"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const nav = [
  { href: "/", label: "Lost & Found" },
  { href: "/report", label: "Report Found Item" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <>
      {/* 🔴 Top Header */}
      <header className="sticky top-0 z-30 border-b border-red-800 bg-red-700 text-white shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight hover:text-yellow-300 transition"
            >
              🎒 Lost & Found
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-base">
              {nav.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`rounded-xl px-3 py-1.5 transition font-medium ${
                      active
                        ? "bg-yellow-400 text-red-800 shadow-inner"
                        : "text-white/90 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Auth + Search */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-base hover:bg-white/20 transition"
              aria-label="Search items"
              title="Search items"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </Link>

            <Link
              href="/signin"
              className="rounded-xl bg-yellow-400 px-3 py-1.5 text-base font-semibold text-red-800 hover:bg-yellow-300 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ⚠️ Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 text-center text-sm sm:text-base text-yellow-900 py-2 px-4 shadow-sm">
        ⚠️ <span className="font-semibold">Important Notice:</span> Items
        unclaimed after <strong>60 days</strong> may be donated or disposed of
        according to school policy.
      </div>
    </>
  );
}
