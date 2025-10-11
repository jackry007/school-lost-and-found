// src/components/SchoolHeaderLogo.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
// from src/components -> .. (src) -> .. (project root) -> public/images/...
import logo from "../../public/images/cherry-creek-logo.png";

export default function SchoolHeaderLogo() {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex w-full items-center justify-between pl-0 pr-8 lg:pr-12 py-6">
        {/* Left: Logo + Text */}
        <Link
          href="/"
          className="flex items-center gap-6 no-underline"
          aria-label="Cherry Creek High School Home"
        >
          <Image
            src={logo}
            alt="Cherry Creek High School logo"
            className="h-28 w-auto"
            priority
          />

          <div className="leading-tight select-none">
            <div className="text-4xl font-extrabold tracking-tight text-[#BF1E2E]">
              CHERRY CREEK
            </div>
            <div className="text-3xl font-semibold text-[#BF1E2E]">
              HIGH SCHOOL
            </div>
          </div>
        </Link>

        {/* Optional right spacing (for balance or future items) */}
        <div className="hidden sm:block w-[100px]" />
      </div>
    </div>
  );
}
