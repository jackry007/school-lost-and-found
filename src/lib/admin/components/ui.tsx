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
    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
      {children}
    </h2>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "amber" | "green" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
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
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      style={{ background: `linear-gradient(180deg, ${tint} 0%, white 65%)` }}
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </div>
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
      className={`flex flex-col gap-4 bg-white p-4 md:flex-row md:items-start md:justify-between ${className}`}
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
      <div className="truncate font-medium text-gray-900">{title}</div>
      {meta && (
        <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
          {meta}
        </div>
      )}
    </div>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
  );
}

/* ---------- Button Component ---------- */

export function Btn({
  children,
  onClick,
  tone = "approve",
  disabled,
  className = "",
  style,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  tone?:
    | "approve"
    | "reject"
    | "message"
    | "schedule"
    | "edit"
    | "success"
    | "ghost"
    | "primary";
}) {
  const base =
    "inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-1 text-sm font-medium shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm";

  if (tone === "approve" || tone === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white hover:brightness-95 ${className}`}
        style={{ background: CREEK_NAVY, ...style }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (tone === "reject") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white hover:brightness-95 ${className}`}
        style={{ background: CREEK_RED, ...style }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (tone === "message") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} border hover:bg-slate-100 ${className}`}
        style={{
          background: "#F8FAFC",
          color: "#475569",
          borderColor: "#CBD5E1",
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (tone === "schedule") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} border hover:brightness-95 ${className}`}
        style={{
          background: "#FFF7ED",
          color: "#B45309",
          borderColor: "#FCD34D",
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (tone === "edit") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} border hover:brightness-95 ${className}`}
        style={{
          background: CREEK_SOFTN,
          color: CREEK_NAVY,
          borderColor: "#BFDBFE",
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (tone === "success") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} text-white hover:brightness-95 ${className}`}
        style={{ background: "#15803D", ...style }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Status + Thumbnail ---------- */

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
          ? "bg-blue-100 text-blue-800"
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
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${look}`}
    >
      {label}
    </span>
  );
}

export function Thumb({ src, alt }: { src?: string; alt?: string }) {
  return (
    <div className="mr-3 h-12 w-16 cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition hover:shadow-sm">
      <img
        src={src || FALLBACK_THUMB}
        alt={alt || ""}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
