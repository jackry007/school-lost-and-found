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
  claimant_name: string;
  claimant_email: string;
  notes: string; // message to admin
  proof: string | null; // combined proof fields
  // status omitted; DB defaults to 'pending'
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
      Prefer: "return=representation", // return inserted row
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || "Failed to submit claim.");
  return (await res.json()) as Array<{ id: number | string }>;
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

const Help = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <p id={id} className="mt-1 text-xs text-gray-500">
    {children}
  </p>
);

const StatusPill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="rounded-full px-2 py-0.5 text-xs font-medium"
    style={{ background: "#0b2c5c14", color: CREEK_NAVY }}
  >
    {children}
  </span>
);

/* ========= Page ========= */
export default function ClaimPage() {
  const sp = useSearchParams();
  const itemId = useMemo(() => sp.get("item")?.trim() ?? "", [sp]);

  const [item, setItem] = useState<ItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [message, setMessage] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | string | null>(null);
  const [msgFocused, setMsgFocused] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // spam trap

  // validation
  const vName = claimantName.trim().length > 1;
  const vEmail = /\S+@\S+\.\S+/.test(claimantEmail.trim());
  const vMessage = message.trim().length >= 20; // detailed message encouraged
  const vAnyProof = q1.trim().length > 0 || q2.trim().length > 0;

  // final validity: must have name + email AND (message OR any proof)
  const isValid =
    !!itemId && vName && vEmail && (vMessage || vAnyProof) && !honeypot;

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
      const proofCombined =
        [q1.trim(), q2.trim()].filter(Boolean).join(" | ") || null;

      const created = await createClaim({
        item_id: item.id,
        claimant_name: claimantName.trim(),
        claimant_email: claimantEmail.trim(),
        notes: message.trim(), // store message in `notes`
        proof: proofCombined, // optional
      });

      const inserted = created?.[0];
      setSubmittedId(inserted?.id ?? null);

      // clear form (keep email in success card)
      setClaimantName("");
      // keep claimantEmail to show in success message
      setMessage("");
      setQ1("");
      setQ2("");
    } catch (e: any) {
      setErr(e?.message || "Failed to submit claim.");
      // focus error box for a11y
      setTimeout(() => document.getElementById("error-box")?.focus(), 0);
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

        {/* aria-live region for a11y */}
        <div aria-live="polite" className="sr-only">
          {err
            ? `Error: ${err}`
            : submittedId
            ? `Success. Reference ${String(submittedId)}`
            : ""}
        </div>

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
          <div
            id="error-box"
            tabIndex={-1}
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 focus:outline-none"
          >
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
              {/* Honeypot (hidden) */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                onChange={(e) => setHoneypot(e.target.value)}
              />

              <p className="mb-5 text-sm text-gray-600" id="form-guide">
                Provide <span className="font-medium">either</span> a detailed
                message <span className="font-medium">or</span> one proof
                detail. Please don’t include sensitive personal info.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Name */}
                <div>
                  <Label htmlFor="name" required>
                    Full Name
                  </Label>
                  <input
                    id="name"
                    autoComplete="name"
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    required
                    aria-invalid={!vName}
                    aria-describedby="form-guide"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: vName ? "#e5e7eb" : "#fecaca",
                      boxShadow: vName ? undefined : "0 0 0 2px #fee2e2 inset",
                    }}
                    placeholder="e.g., John Smith"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" required>
                    Contact Email
                  </Label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={claimantEmail}
                    onChange={(e) => setClaimantEmail(e.target.value)}
                    required
                    aria-invalid={!vEmail}
                    aria-describedby="form-guide email-help"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: vEmail ? "#e5e7eb" : "#fecaca",
                      boxShadow: vEmail ? undefined : "0 0 0 2px #fee2e2 inset",
                    }}
                    placeholder="johnsmith@cherrycreekschools.org"
                  />
                  <Help id="email-help">
                    We’ll contact you about this claim at this address.
                  </Help>
                </div>

                {/* Message (optional, full width) */}
                <div className="md:col-span-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <textarea
                    id="message"
                    rows={6}
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setMsgFocused(true)}
                    onBlur={() => setMsgFocused(false)}
                    aria-invalid={!vMessage && !vAnyProof}
                    aria-describedby="form-guide msg-help message-count"
                    className="mt-1 w-full rounded-xl border p-3 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor:
                        vMessage || vAnyProof ? "#e5e7eb" : "#fecaca",
                      boxShadow:
                        vMessage || vAnyProof
                          ? undefined
                          : "0 0 0 2px #fee2e2 inset",
                    }}
                    placeholder={`Helpful details:
• Where you think you left it (room/hallway/cafeteria)
• When you last saw it
• Description (color/brand/case/unique marks)
• Anything only you would know (engraving, last 4, stickers)`}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <Help id="msg-help">
                      Give a detailed message or at least one proof below.
                    </Help>
                    {msgFocused && (
                      <span
                        id="message-count"
                        className={`text-xs ${
                          vMessage ? "text-gray-500" : "text-red-600"
                        }`}
                      >
                        {message.trim().length}/20
                      </span>
                    )}
                  </div>
                </div>

                {/* Proof #1 (optional) */}
                <div>
                  <Label htmlFor="q1">
                    Proof detail #1 (optional){" "}
                    <span className="font-normal text-gray-500">
                      — try brand, case color, last 4 digits, engraving
                    </span>
                  </Label>
                  <input
                    id="q1"
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    spellCheck={false}
                    aria-describedby="form-guide proof1-help"
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(11,44,92,.25)]"
                    placeholder="e.g., Last 4 digits on the case: 1420"
                  />
                  <Help id="proof1-help">
                    Only share details someone else wouldn’t know.
                  </Help>
                </div>

                {/* Proof #2 (optional) */}
                <div>
                  <Label htmlFor="q2">Proof detail #2 (optional)</Label>
                  <input
                    id="q2"
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    spellCheck={false}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(11,44,92,.25)]"
                    placeholder="Anything else that proves it's yours"
                  />
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
                  ✅ Claim received! We’ll review and contact you at{" "}
                  <b>{claimantEmail || "your email"}</b>.
                  <br />
                  Reference ID:{" "}
                  <code className="font-mono">{String(submittedId)}</code>
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center rounded border px-2 py-0.5 text-xs"
                    onClick={() =>
                      navigator.clipboard.writeText(String(submittedId))
                    }
                    aria-label="Copy reference ID"
                  >
                    Copy
                  </button>
                  <div className="mt-1 text-gray-700">
                    Pick up at the Front Office during school hours. Bring your
                    student ID.
                  </div>
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
                  {submitting && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  )}
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
