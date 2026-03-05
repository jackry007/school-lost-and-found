"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

function toISO(d: Date) {
  // yyyy-mm-dd
  return d.toISOString().slice(0, 10);
}

export default function CreekDatePicker({
  value,
  onChange,
  creekRed,
  creekNavy,
  required,
}: {
  value: string;
  onChange: (iso: string) => void;
  creekRed: string;
  creekNavy: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // close on outside click / esc
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = useMemo(() => {
    if (!value) return undefined;
    // prevent timezone weirdness
    return new Date(value + "T00:00:00");
  }, [value]);

  const label = value
    ? format(new Date(value + "T00:00:00"), "MM/dd/yyyy")
    : "Select a date";

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger button (NOT type=date) */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm
                   outline-none focus:ring-2 focus:ring-[rgba(11,44,92,0.6)] focus:border-[rgba(11,44,92,1)]
                   flex items-center justify-between"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {label}
          {required && !value ? (
            <span className="ml-2 text-xs" style={{ color: creekRed }}>
              (required)
            </span>
          ) : null}
        </span>
        <span className="text-gray-500">📅</span>
      </button>

      {/* Popover calendar */}
      {open && (
        <div className="absolute z-50 mt-2 w-[340px] rounded-2xl border bg-white shadow-xl overflow-hidden">
          {/* Creek header ribbon */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: "#0047BB" }}
          >
            <div className="text-sm font-semibold text-white">
              Select date found
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white text-sm"
              aria-label="Close calendar"
            >
              ✕
            </button>
          </div>

          <div className="p-3">
            {/* NOTE: DayPicker has its own default styles; we override key parts below */}
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (!d) return;
                onChange(toISO(d));
                setOpen(false);
              }}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={2035}
              className="creek-rdp"
            />

            <div className="mt-2 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => onChange(toISO(new Date()))}
                className="text-sm font-medium underline"
                style={{ color: creekRed }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-sm font-medium underline"
                style={{ color: creekNavy }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* CSS overrides for CCHS vibe */}
          <style jsx global>{`
            .creek-rdp .rdp-months {
              justify-content: center;
            }
            .creek-rdp .rdp-caption_label {
              font-weight: 700;
              color: ${creekNavy};
            }
            .creek-rdp .rdp-nav button {
              border-radius: 10px;
            }
            .creek-rdp .rdp-day {
              border-radius: 12px;
              font-weight: 600;
            }
            .creek-rdp .rdp-day:hover:not([aria-selected="true"]) {
              background: rgba(11, 44, 92, 0.08);
            }
            .creek-rdp .rdp-day[aria-selected="true"] {
              background: ${creekRed};
              color: white;
            }
            .creek-rdp .rdp-day[aria-selected="true"]:hover {
              background: ${creekRed};
            }
            .creek-rdp .rdp-today {
              outline: 2px solid rgba(11, 44, 92, 0.35);
              outline-offset: 2px;
            }
            .creek-rdp select {
              border: 1px solid rgba(11, 44, 92, 0.2);
              border-radius: 10px;
              padding: 6px 8px;
              font-size: 12px;
              font-weight: 600;
              color: ${creekNavy};
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
