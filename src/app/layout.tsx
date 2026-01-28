// src/app/layout.tsx
// ------------------------------------------------------
// 🏫 Root Layout for the School Lost & Found website
// ------------------------------------------------------

import "./globals.css";
import type { Metadata } from "next";

import { Header } from "@/components/Header";
import SchoolHeaderLogo from "@/components/SchoolHeaderLogo";
import Footer from "@/components/Footer";

import { AuthUIProvider } from "@/components/AuthUIProvider";

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
        {/* ✅ Provider wraps the WHOLE app so any page can open the Header sign-in panel */}
        <AuthUIProvider>
          <SchoolHeaderLogo />
          <Header />

          <main id="main" className="py-8">
            {children}
          </main>

          <Footer />
        </AuthUIProvider>
      </body>
    </html>
  );
}
