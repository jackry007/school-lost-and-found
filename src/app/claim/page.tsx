// /app/claim/page.tsx
"use client";

/**
 * Claim page (Option 1: /claim?item=ID)
 * - Identity comes from Supabase session (no name/email inputs)
 * - Message & proof fields are OPTIONAL
 * - After submit: navigate to /claim?item=ID&chat=1 so the student can message staff
 * - If the page is opened with ?chat=1, auto-open ChatModal with the user's latest claim for that item
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ⬇️ Adjust this path to your project
import ChatModal, { type ChatClaim } from "../../components/ChatModal";

/* ========= Brand / env ========= */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "item-photos";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

/* ========= Helpers ========= */
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
  claimant_email: string | null;
  notes: string;
  proof: string | null;
};

type AuthState = "unknown" | "authed" | "guest";

/* ========= Data helpers ========= */
async function fetchItemById(id: string): Promise<ItemRow | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data ?? null;
}

async function createClaim(payload: ClaimInsert) {
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) throw new Error("Please sign in first.");

  const { data, error } = await supabase
    .from("claims")
    .insert([{ ...payload, claimant_uid: user.id }])
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return [{ id: data!.id as number | string }];
}

/* ========= Small UI bits ========= */
const Label = (
  p: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
) => (
  <label
    {...p}
    className={`block text-sm font-medium text-gray-900 ${p.className || ""}`}
  >
    {p.children} {p.required && <span className="text-red-500">*</span>}
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

/** Login prompt that can open your header auth panel via a custom event */
function LoginPrompt({ backHref }: { backHref: string }) {
  function openHeaderLogin() {
    document.dispatchEvent(new Event("cc-auth:open"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Please sign in</h2>
      <p className="mt-2 text-sm text-gray-600">
        Sign in with your school account to submit a claim.
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Back
        </Link>
      </div>
    </section>
  );
}

/* ========= Page ========= */
export default function ClaimPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const itemId = useMemo(() => sp.get("item")?.trim() ?? "", [sp]);
  const wantsChat = useMemo(() => sp.get("chat") === "1", [sp]);

  const [item, setItem] = useState<ItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [auth, setAuth] = useState<AuthState>("unknown");

  // Identity (read from session)
  const [currentUid, setCurrentUid] = useState<string>("");
  const [claimantName, setClaimantName] = useState("Student");
  const [claimantEmail, setClaimantEmail] = useState<string>("");

  // Form state
  const [message, setMessage] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClaim, setChatClaim] = useState<ChatClaim | null>(null);

  /* ===== Boolean guards ===== */
  const isGuest: boolean = auth === "guest";
  const isAuthed: boolean = auth === "authed";
  const canShowForm: boolean = !submittedId && (isAuthed || auth === "unknown");

  // Fully optional message/proof; only require identity + itemId + no honeypot
  const isValid = !!itemId && isAuthed && !honeypot;

  /* ===== Load identity ===== */
  useEffect(() => {
    async function loadIdentity() {
      const [{ data: sess }, { data: usr }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      const session = sess.session ?? null;
      const user = usr.user ?? session?.user ?? null;

      setAuth(session ? "authed" : "guest");
      setCurrentUid(user?.id ?? "");

      if (user) {
        setClaimantEmail(user.email ?? "");
        setClaimantName(
          (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "Student"
        );
      } else {
        setClaimantEmail("");
        setClaimantName("Student");
      }
    }

    loadIdentity();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const authed = !!s;
      setAuth(authed ? "authed" : "guest");
      const u = s?.user ?? null;
      setCurrentUid(u?.id ?? "");
      setClaimantEmail(u?.email ?? "");
      setClaimantName(
        (u?.user_metadata?.full_name as string) ||
          (u?.email?.split("@")[0] ?? "Student")
      );
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // If guest, optionally open auth panel
  useEffect(() => {
    if (isGuest) {
      document.dispatchEvent(new Event("cc-auth:open"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isGuest]);

  // Optional: /claim?item=18&login=1 → open panel
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (u.searchParams.get("login") === "1") {
      document.dispatchEvent(new Event("cc-auth:open"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  /* ===== Load item ===== */
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

  /* ===== Open chat helper (latest claim for this user+item) ===== */
  const openLatestChat = useCallback(async () => {
    if (!currentUid || !item?.id) {
      console.warn("[openLatestChat] missing uid or item.id");
      return;
    }

    const { data: cl, error } = await supabase
      .from("claims")
      .select(
        "id,item_id,claimant_name,claimant_email,claimant_uid,status,created_at,updated_at"
      )
      .eq("item_id", Number(item.id)) // ✅ force int match
      .eq("claimant_uid", currentUid) // ✅ uuid match
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[openLatestChat] select error:", error.message);
      return;
    }

    if (cl && cl.length > 0) {
      console.log("[openLatestChat] found claim", cl[0]);
      setChatClaim(cl[0] as ChatClaim);
      setChatOpen(true);
    } else {
      console.warn("[openLatestChat] no claim found for this user+item");
    }
  }, [currentUid, item?.id]);

  /* ===== Auto-open chat if ?chat=1 ===== */
  useEffect(() => {
    if (wantsChat && isAuthed && item?.id) {
      openLatestChat();
    }
  }, [wantsChat, isAuthed, item?.id, openLatestChat]);

  /* ===== Submit ===== */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !item || isGuest) return;

    setSubmitting(true);
    setErr(null);
    setSubmittedId(null);

    try {
      const proofCombined =
        [q1.trim(), q2.trim()].filter(Boolean).join(" | ") || null;

      const created = await createClaim({
        item_id: item.id,
        claimant_name: claimantName.trim(),
        claimant_email: (claimantEmail || "").trim() || null,
        notes: message.trim(),
        proof: proofCombined,
      });

      const inserted = created?.[0];
      const newId = inserted?.id ?? null;
      setSubmittedId(newId);

      // 🚀 Immediately take the student to their thread (query-param version)
      // We intentionally navigate to ?chat=1 (not /claim/[id]) to keep static export happy.
      router.push(
        `${BASE}/claim?item=${encodeURIComponent(String(item.id))}&chat=1`
      );
      return; // prevent showing the fallback success screen
    } catch (e: any) {
      setErr(e?.message || "Failed to submit claim.");
      setTimeout(() => document.getElementById("error-box")?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  }

  const backToSearchHref = `${BASE}/search`;
  const backToItemHref = `${BASE}/item/?id=${encodeURIComponent(itemId || "")}`;

  const title = item?.title ? `Claim: ${item.title}` : "Claim Item";
  const imgSrc = publicUrlFromPath(item?.photo_url);
  const disableSubmit = !isValid || submitting || isGuest;

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

          {/* Quick Messages button */}
          {/* {isAuthed && (
            <div className="mt-3">
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={openLatestChat}
                title="Open Messages"
              >
                Open Messages
              </button>
            </div>
          )} */}
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
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 focus-outline-none"
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

            {/* If guest, show login prompt */}
            {isGuest && <LoginPrompt backHref={backToItemHref} />}

            {/* Form (only if NOT submitted yet) */}
            {canShowForm && (
              <form
                onSubmit={onSubmit}
                noValidate
                className="mt-6 rounded-2xl border bg-white p-5 shadow-sm"
              >
                {/* Honeypot (hidden) */}
                <input
                  type="text"
                  inputMode="none"
                  name="hp_cc_lf_v1"
                  tabIndex={-1}
                  autoComplete="new-password"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: 0,
                    height: 0,
                  }}
                  onChange={(e) => setHoneypot(e.target.value)}
                />

                {/* Read-only identity */}
                {isAuthed && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    Signed in as <b>{claimantName || "Student"}</b>{" "}
                    <span className="text-gray-500">
                      {claimantEmail ? `(${claimantEmail})` : ""}
                    </span>
                  </div>
                )}

                <p className="mb-5 text-sm text-gray-600" id="form-guide">
                  Message and proof details are <b>optional</b>. Share anything
                  that helps us verify it’s yours. Please don’t include
                  sensitive personal info.
                </p>

                <div className="grid gap-5 md:grid-cols-2">
                  {/* Message (optional) */}
                  <div className="md:col-span-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <textarea
                      id="message"
                      rows={6}
                      maxLength={1000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 w-full rounded-xl border p-3 text-sm outline-none transition focus-ring-2"
                      placeholder={`Helpful details:
• Where you think you left it (room/hallway/cafeteria)
• When you last saw it
• Description (color/brand/case/unique marks)
• Anything only you would know (engraving, last 4, stickers)`}
                    />
                  </div>

                  {/* Proof #1 (optional) */}
                  <div>
                    <Label htmlFor="q1">
                      Proof detail #1 (optional){" "}
                      <span className="font-normal text-gray-500">
                        — brand, case color, last 4 digits, engraving
                      </span>
                    </Label>
                    <input
                      id="q1"
                      value={q1}
                      onChange={(e) => setQ1(e.target.value)}
                      spellCheck={false}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus-ring-2 focus-ring-[rgba(11,44,92,.25)]"
                      placeholder="e.g., Last 4 digits on the case: 1420"
                    />
                    <Help>Only share details someone else wouldn’t know.</Help>
                  </div>

                  {/* Proof #2 (optional) */}
                  <div>
                    <Label htmlFor="q2">Proof detail #2 (optional)</Label>
                    <input
                      id="q2"
                      value={q2}
                      onChange={(e) => setQ2(e.target.value)}
                      spellCheck={false}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus-ring-2 focus-ring-[rgba(11,44,92,.25)]"
                      placeholder="Anything else that proves it's yours"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={disableSubmit}
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
              </form>
            )}

            {/* Success fallback (only shows if we couldn't navigate for some reason) */}
            {submittedId && (
              <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
                <h2 className="text-lg font-semibold mb-2">
                  ✅ Claim received!
                </h2>
                <p className="text-sm mb-2">
                  We’ll review and contact you at{" "}
                  <b>{claimantEmail || "your school email"}</b>.
                </p>
                <p className="text-sm mb-4">
                  Reference ID:{" "}
                  <code className="font-mono text-green-800">
                    {String(submittedId)}
                  </code>
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
                </p>
                <div className="flex gap-3">
                  {/* <Link
                    href={`${BASE}/claim?item=${encodeURIComponent(
                      String(itemId)
                    )}&chat=1`}
                    className="inline-flex items-center justify-center rounded-lg bg-[#BF1E2E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                  >
                    Open Messages
                  </Link> */}
                  <Link
                    href={backToSearchHref}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    ← Back to Search
                  </Link>
                </div>
              </section>
            )}

            {/* Sticky submit bar (mobile) — only when form is visible */}
            {!submittedId && (
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 block p-3 md:hidden">
                <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border bg-white p-3 shadow-lg">
                  <button
                    type="button"
                    onClick={() =>
                      (
                        document.querySelector("form") as HTMLFormElement
                      )?.requestSubmit()
                    }
                    disabled={disableSubmit}
                    className="w-full rounded-xl bg-[#BF1E2E] px-4 py-3 text-center text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit Claim"}
                  </button>
                </div>
              </div>
            )}
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

      {/* Chat Modal */}
      {chatOpen && chatClaim && (
        <ChatModal
          open={chatOpen}
          claim={chatClaim}
          onClose={() => setChatOpen(false)}
          meIsStaff={false}
          currentUid={currentUid}
        />
      )}
    </main>
  );
}
