// src/app/layout.tsx
// ------------------------------------------------------
// 🏫 Root Layout for the School Lost & Found website
// ------------------------------------------------------
// This file defines the global structure, design, and metadata
// that wrap around every page (Home, Report, Search, Admin, etc).
//
//
// Every page automatically appears inside this layout’s <main> area.
// ------------------------------------------------------

import "./globals.css"; // Global styles (Tailwind + theme variables)
import type { Metadata } from "next";
import { Header } from "@/components/Header"; // Red Lost & Found header bar (navigation)
import SchoolHeaderLogo from "@/components/SchoolHeaderLogo"; // White band with school logo
import Footer from "@/components/Footer"; // ✅ Footer (Contact · Privacy · Terms · Language)

// ------------------------------------------------------
// 🔖 Metadata for SEO, browser tabs, and competition clarity
// ------------------------------------------------------
// Appears as the browser tab title and description in search engines.

export const metadata: Metadata = {
  title: "School Lost & Found",
  description: "Report and find lost items easily.",
};

// ------------------------------------------------------
// 🧩 RootLayout Component
// ------------------------------------------------------
// "children" = the current page (e.g. Home, Report, etc.)
// Next.js automatically injects the active page into {children}.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* lang="en" helps accessibility and screen readers */}
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased"
      >
        {/* White Cherry Creek logo band (top of every page) */}
        <SchoolHeaderLogo />

        {/* Red Lost & Found header with navigation links */}
        <Header />

        {/* Page content area */}
        <main id="main" className="py-8">
          {children}
        </main>

        {/* ✅ Footer appears on every page */}
        <Footer />
      </body>
    </html>
  );
}
