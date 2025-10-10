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
    <header className="sticky top-0 z-20 border-b border-[var(--accent-red)] bg-[var(--accent-blue)] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            🎒 Lost & Found
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-xl px-3 py-1 transition font-medium ${
                    active
                      ? "bg-[var(--accent-red)] text-white"
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
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            aria-label="Search items"
            title="Search items"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link
            href="/signin"
            className="rounded-xl bg-[var(--accent-red)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#a91b28]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
