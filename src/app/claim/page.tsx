"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ========= Brand / env ========= */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = "item-photos";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* same fallback/helper as Item page */
const FALLBACK_IMG = `${BASE}/no-image.png`;
function publicUrlFromPath(path?: string | null) {
  if (!path) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/* ========= Types ========= */
type ItemRow = {
  id: number | string;
  title: string | null;
  category: string | null;
  location: string | null;
  date_found: string | null;
  photo_url: string | null;
  description: string | null;
  notes: string | null;
  status: string | null;
};

type ClaimInsert = {
  item_id: number | string;
  message: string;
  proof_answers_json: Record<string, string>;
  availability: string; // we store the human summary the picker emits
};

/* ========= Data helpers ========= */
async function fetchItemById(id: string): Promise<ItemRow | null> {
  const url = `${SB_URL}/rest/v1/items?id=eq.${encodeURIComponent(
    id
  )}&select=*`;
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as ItemRow[];
  return rows?.[0] ?? null;
}

async function createClaim(payload: ClaimInsert) {
  const res = await fetch(`${SB_URL}/rest/v1/claims`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || "Failed to submit claim.");
  return (await res.json()) as Array<{ id: string }>;
}

/* ========= Small UI helpers ========= */
const Label = (
  p: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
) => (
  <label
    {...p}
    className={`block text-sm font-medium text-gray-900 ${p.className || ""}`}
  >
    {p.children}{" "}
    {p.required && (
      <span className="text-red-500" title="Required">
        *
      </span>
    )}
  </label>
);
const Help = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-xs text-gray-500">{children}</p>
);
const StatusPill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="rounded-full px-2 py-0.5 text-xs font-medium"
    style={{ background: "#0b2c5c14", color: CREEK_NAVY }}
  >
    {children}
  </span>
);

/* ========= Periods-only Availability Picker ========= */
// Days: Mon–Fri, Slots: Before, P1–P8, After (to 4:30 pm)
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SLOTS = [
  { id: "before", label: "Before School" },
  { id: "P1", label: "P1" },
  { id: "P2", label: "P2" },
  { id: "P3", label: "P3" },
  { id: "P4", label: "P4" },
  { id: "P5", label: "P5" },
  { id: "P6", label: "P6" },
  { id: "P7", label: "P7" },
  { id: "P8", label: "P8" },
  { id: "after", label: "After School (to 4:30 pm)" },
] as const;

function PickupAvailability({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  // Best-effort parse of an incoming summary string
  useEffect(() => {
    if (!value) return;
    const [dStr, sStr] = value.split("•").map((s) => s.trim());
    if (dStr) {
      const ds = dStr.split(",").map((s) => s.trim());
      setDays(DAYS.filter((d) => ds.includes(d)));
    }
    if (sStr) {
      const labels = sStr.split(",").map((s) => s.trim());
      const ids = SLOTS.filter((s) =>
        labels.some((l) => l.startsWith(s.label))
      ).map((s) => s.id);
      setSlots(ids);
    }
  }, [value]);

  // Emit compact human-readable summary
  useEffect(() => {
    if (!days.length || !slots.length) onChange("");
    else {
      const slotLabels = slots
        .map((id) => SLOTS.find((s) => s.id === id)!.label)
        .join(",");
      onChange(`${days.join(",")} • ${slotLabels}`);
    }
  }, [days, slots, onChange]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  return (
    <div className="space-y-3">
      {/* Days */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggle(days, setDays, d)}
            className={cx(
              "rounded-xl border px-3 py-1.5 text-sm",
              days.includes(d)
                ? "border-[#0B2C5C] bg-[#0B2C5C] text-white"
                : "border-gray-300 hover:bg-gray-50"
            )}
            aria-pressed={days.includes(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Periods */}
      <div className="flex flex-wrap gap-2">
        {SLOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(slots, setSlots, s.id)}
            className={cx(
              "rounded-xl border px-3 py-1.5 text-sm",
              slots.includes(s.id)
                ? "border-[#BF1E2E] bg-[#BF1E2E] text-white"
                : "border-gray-300 hover:bg-gray-50"
            )}
            aria-pressed={slots.includes(s.id)}
            title={
              s.id === "after" ? "Student available until 4:30 pm" : undefined
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-600">
        {days.length && slots.length ? (
          <>
            Selected: <span className="font-medium">{days.join(",")}</span> •{" "}
            <span className="font-medium">
              {slots
                .map((id) => SLOTS.find((s) => s.id === id)!.label)
                .join(", ")}
            </span>
          </>
        ) : (
          "Pick at least one day and one period."
        )}
      </p>
    </div>
  );
}

/* ========= Page ========= */
export default function ClaimPage() {
  const sp = useSearchParams();
  const itemId = useMemo(() => sp.get("item")?.trim() ?? "", [sp]);

  const [item, setItem] = useState<ItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [message, setMessage] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [availability, setAvailability] = useState(""); // picker writes here
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // validation
  const vMessage = message.trim().length >= 20;
  const vQ1 = q1.trim().length >= 4;
  const vAvail = availability.trim().length >= 4; // picker returns "" until valid
  const isValid = !!itemId && vMessage && vQ1 && vAvail;

  // load item
  useEffect(() => {
    if (!itemId) {
      setErr("Missing item id.");
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setErr(null);
    setItem(null);
    fetchItemById(itemId)
      .then((row) => {
        if (!alive) return;
        if (!row) setErr("Item not found or not publicly listed.");
        setItem(row ?? null);
      })
      .catch((e) => alive && setErr(e?.message || "Failed to load item."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [itemId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !item) return;

    setSubmitting(true);
    setErr(null);
    setSubmittedId(null);
    try {
      const created = await createClaim({
        item_id: item.id,
        message: message.trim(),
        availability: availability.trim(),
        proof_answers_json: {
          proof_1: q1.trim(),
          ...(q2.trim() ? { proof_2: q2.trim() } : {}),
        },
      });
      setSubmittedId(created?.[0]?.id ?? "ok");
      setMessage("");
      setQ1("");
      setQ2("");
      setAvailability("");
    } catch (e: any) {
      setErr(e?.message || "Failed to submit claim.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = item?.title ? `Claim: ${item.title}` : "Claim Item";
  const backToItemHref = `${BASE}/item/?id=${encodeURIComponent(itemId)}`;
  const backToSearchHref = `${BASE}/search`;
  const imgSrc = publicUrlFromPath(item?.photo_url);

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-[#0b2c5c0d] to-transparent">
      {/* Accent ribbon */}
      <div
        className="h-1.5 w-full"
        style={{
          backgroundImage: `linear-gradient(90deg, ${CREEK_RED}, ${CREEK_NAVY})`,
        }}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={backToItemHref}
            className="underline decoration-dotted underline-offset-4 hover:opacity-90"
            style={{ color: CREEK_NAVY }}
          >
            ← Back to Item
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={backToSearchHref}
            className="underline decoration-dotted underline-offset-4 hover:opacity-90"
            style={{ color: CREEK_NAVY }}
          >
            Back to Search
          </Link>
        </nav>

        {/* Title / meta */}
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
          {item && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>{item.category || "—"}</span>
              <span aria-hidden>•</span>
              <span>{item.location || "—"}</span>
              <span aria-hidden>•</span>
              <span>
                {item.date_found
                  ? new Date(item.date_found).toLocaleDateString()
                  : "—"}
              </span>
              {item.status && <StatusPill>{item.status}</StatusPill>}
            </div>
          )}
        </header>

        {/* Errors / loading */}
        {!itemId && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            No item id provided.
          </div>
        )}
        {itemId && loading && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex gap-4">
              <div className="h-28 w-36 animate-pulse rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>
        )}
        {itemId && err && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {err}
          </div>
        )}

        {/* Content */}
        {itemId && !loading && !err && item && (
          <>
            {/* Item header card */}
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="relative aspect-[4/5] h-28 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={item.title ?? "Item photo"}
                    className="h-full w-full object-cover"
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)
                    }
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-900">
                    {item.title || "Unlabeled item"}
                  </h2>
                  {item.description || item.notes ? (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {item.description || item.notes}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-gray-500">
                      No description provided.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Form */}
            <form
              onSubmit={onSubmit}
              noValidate
              className="mt-6 rounded-2xl border bg-white p-5 shadow-sm"
            >
              <p className="mb-5 text-sm text-gray-600">
                Answer the proof questions and share your pickup availability.
                Don’t include personal info beyond what’s requested.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Message (full width) */}
                <div className="md:col-span-2">
                  <Label htmlFor="message" required>
                    Message to Admin
                  </Label>
                  <textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={20}
                    aria-invalid={!vMessage}
                    aria-describedby="message-help message-count"
                    className={`mt-1 w-full rounded-xl border p-3 text-sm outline-none transition focus:ring-2`}
                    style={{
                      borderColor: vMessage ? "#e5e7eb" : "#fecaca",
                      boxShadow: vMessage
                        ? undefined
                        : "0 0 0 2px #fee2e2 inset",
                    }}
                    placeholder="Describe the item and why you believe it's yours."
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <Help>Minimum 20 characters.</Help>
                    <span
                      id="message-count"
                      className={`text-xs ${
                        vMessage ? "text-gray-500" : "text-red-600"
                      }`}
                    >
                      {message.trim().length}/20
                    </span>
                  </div>
                </div>

                {/* Proof #1 */}
                <div>
                  <Label htmlFor="q1" required>
                    Proof detail #1{" "}
                    <span className="font-normal text-gray-500">
                      (engraving, sticker, last 4 digits, unique mark)
                    </span>
                  </Label>
                  <input
                    id="q1"
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    required
                    aria-invalid={!vQ1}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: vQ1 ? "#e5e7eb" : "#fecaca",
                      boxShadow: vQ1 ? undefined : "0 0 0 2px #fee2e2 inset",
                    }}
                    placeholder="e.g., 'Last 4 digits on the case: 1420'"
                  />
                  <Help>Required.</Help>
                </div>

                {/* Proof #2 */}
                <div>
                  <Label htmlFor="q2">Proof detail #2 (optional)</Label>
                  <input
                    id="q2"
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(11,44,92,.25)]"
                    placeholder="Anything else that proves it's yours"
                  />
                </div>

                {/* Availability (full width) */}
                <div className="md:col-span-2">
                  <Label htmlFor="avail" required>
                    Preferred Pickup Times
                  </Label>
                  {/* hidden input for semantics */}
                  <input
                    id="avail"
                    type="hidden"
                    value={availability}
                    readOnly
                  />
                  <PickupAvailability
                    value={availability}
                    onChange={setAvailability}
                  />
                  <Help>
                    Choose days and periods. “After School” means available
                    until 4:30 pm.
                  </Help>
                  {!vAvail && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      Please select at least one day and one period.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BF1E2E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                >
                  {submitting && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  )}
                  {submitting ? "Submitting…" : "Submit Claim"}
                </button>
                <Link
                  href={backToItemHref}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>

              {submittedId && (
                <div
                  className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
                  role="status"
                >
                  ✅ Claim received! We’ll email you after review. Reference:{" "}
                  <span className="font-mono">{submittedId}</span>
                </div>
              )}
            </form>

            {/* Sticky submit bar (mobile) */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 block p-3 md:hidden">
              <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border bg-white p-3 shadow-lg">
                <button
                  type="button"
                  onClick={() =>
                    (
                      document.querySelector("form") as HTMLFormElement
                    )?.requestSubmit()
                  }
                  disabled={!isValid || submitting}
                  className="w-full rounded-xl bg-[#BF1E2E] px-4 py-3 text-center text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Claim"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-gray-500">
          Bring a student ID for pickup • Please don’t post personal info •
          Questions? Visit{" "}
          <Link href={`${BASE}/faq`} className="underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
