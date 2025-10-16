// src/app/layout.tsx
// ------------------------------------------------------
// 🏫 Root Layout for the School Lost & Found website
// ------------------------------------------------------
import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import SchoolHeaderLogo from "@/components/SchoolHeaderLogo";
import MainShell from "@/components/MainShell";

// 🔖 Metadata
export const metadata: Metadata = {
  title: "School Lost & Found",
  description: "Report and find lost items easily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased"
      >
        {/* White Cherry Creek logo band (top of every page) */}
        <SchoolHeaderLogo />

        {/* Red Lost & Found header with navigation links */}
        <Header />

        {/* Page content area (hydration-safe wrapper adds any dynamic classes after mount) */}
        <MainShell>{children}</MainShell>

        {/* Potential Footer Area */}
      </body>
    </html>
  );
}
