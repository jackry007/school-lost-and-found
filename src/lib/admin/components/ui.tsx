// src/lib/admin/components/ui.tsx
"use client";

import React from "react";
import {
  CREEK_NAVY,
  CREEK_RED,
  CREEK_SOFTN,
  FALLBACK_THUMB,
} from "../constants";

/* ---------- Small UI primitives ---------- */

export function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold">
      {children}
    </h2>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "amber" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tint = "#f8fafc",
}: {
  label: string;
  value: number | string;
  tint?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      style={{ background: `linear-gradient(180deg, ${tint} 0%, white 60%)` }}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm shadow-sm transition ${
        active ? "text-white" : "text-gray-700 hover:bg-gray-50"
      }`}
      style={{
        borderColor: active ? "transparent" : "#e5e7eb",
        background: active
          ? `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`
          : "white",
      }}
    >
      {children}
    </button>
  );
}

export function Row({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
      {text}
    </div>
  );
}

export function RowInfo({
  title,
  meta,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{title}</div>
      {meta && (
        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
          {meta}
        </div>
      )}
    </div>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 gap-2">{children}</div>;
}

export function Btn({
  children,
  onClick,
  tone = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "danger" | "ghost" | "success";
  disabled?: boolean;
}) {
  const base = "rounded-full px-3 py-1.5 text-sm";
  if (tone === "primary")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white shadow-sm disabled:opacity-60`}
        style={{
          background: `linear-gradient(135deg, ${CREEK_RED} 0%, ${CREEK_NAVY} 100%)`,
        }}
      >
        {children}
      </button>
    );
  if (tone === "danger")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white shadow-sm disabled:opacity-60`}
        style={{
          background: "linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)",
        }}
      >
        {children}
      </button>
    );
  if (tone === "success")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white shadow-sm disabled:opacity-60`}
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
        }}
      >
        {children}
      </button>
    );
  if (tone === "secondary")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} border text-[13px] disabled:opacity-60`}
        style={{
          color: CREEK_NAVY,
          borderColor: CREEK_NAVY,
          background: CREEK_SOFTN,
        }}
      >
        {children}
      </button>
    );
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

export type ItemStatusWidened =
  | "pending"
  | "listed"
  | "on_hold"
  | "claimed"
  | "rejected";

export function StatusBadge({ status }: { status: ItemStatusWidened }) {
  const look =
    status === "claimed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "on_hold"
      ? "bg-amber-100 text-amber-800"
      : status === "listed"
      ? "bg-green-100 text-green-800"
      : status === "pending"
      ? "bg-amber-100 text-amber-800"
      : status === "rejected"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-800";
  const label =
    status === "claimed"
      ? "Picked Up"
      : status === "on_hold"
      ? "On Hold"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${look}`}>
      {label}
    </span>
  );
}

export function Thumb({ src, alt }: { src?: string; alt?: string }) {
  return (
    <div className="mr-3 h-12 w-16 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || FALLBACK_THUMB}
        alt={alt || ""}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
