// src/lib/admin/components/Header.tsx
"use client";
import React from "react";
import { CREEK_NAVY, CREEK_RED } from "../constants";

export function Header({
  role,
  onSignOut,
}: {
  role: string | null;
  onSignOut: () => void;
}) {
  return (
    <header
      className="w-full"
      style={{
        background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-white/80">
            Creek Lost &amp; Found • moderation &amp; insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs ring-1 ring-white/20">
              Signed in as <strong className="font-semibold">{role}</strong>
            </span>
          )}
          <button
            onClick={onSignOut}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-gray-900 shadow hover:bg-white/90"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
