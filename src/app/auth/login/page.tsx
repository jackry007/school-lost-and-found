// src/app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BASE } from "@/lib/basePath";
import Link from "next/link";

const CREEK_RED = "#BF1E2E";
const CREEK_RED_DARK = "#A81524";
const CREEK_NAVY = "#0B2C5C";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    location.href = "/admin";
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white text-slate-900">
      {/* ---------- Left: Hero image with overlay ---------- */}
      <div className="relative hidden md:flex">
        {/* Creek ribbon */}
        <div
          className="absolute top-0 left-0 h-1.5 w-full z-20"
          style={{
            background: `linear-gradient(90deg, ${CREEK_RED} 0%, ${CREEK_RED_DARK} 100%)`,
          }}
        />

        {/* Background photo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url(${BASE}/images/authHero.png)`,
            backgroundAttachment: "fixed",
          }}
        />

        {/* Dark gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Subtle dot texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-15 mix-blend-soft-light"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full text-white">
          <div className="space-y-6">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl grid place-content-center font-bold shadow"
                style={{ background: CREEK_RED }}
                aria-hidden
              >
                🎒
              </div>
              <div>
                <div className="text-sm tracking-wide opacity-90">
                  Cherry Creek High School
                </div>
                <h1 className="text-2xl font-semibold leading-tight">
                  Lost &amp; Found — Admin
                </h1>
              </div>
            </div>

            <p className="text-white/90 max-w-sm">
              Fast, fair, and secure—sign in to review claims and keep items
              moving back to their owners.
            </p>
          </div>

          {/* Quick stats (placeholder data) */}
          <div className="grid grid-cols-3 gap-3 text-white/95">
            <Stat label="Total Items" value="128" />
            <Stat label="Reunited" value="96" />
            <Stat label="Claim Rate" value="75%" />
          </div>
        </div>
      </div>

      {/* ---------- Right: Sign-in Card ---------- */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="mb-6 md:hidden">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl grid place-content-center text-white font-bold shadow"
                style={{ background: CREEK_RED }}
                aria-hidden
              >
                🎒
              </div>
              <div>
                <div className="text-xs tracking-wide text-slate-600">
                  Cherry Creek High School
                </div>
                <h1 className="text-lg font-semibold">
                  Lost &amp; Found — Admin
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 shadow-[0_6px_24px_rgba(2,6,23,0.06)] p-6 sm:p-7 bg-white">
            <h2 className="text-xl font-semibold">Admin Sign in</h2>
            <p className="text-sm text-slate-600 mt-1">
              Authorized staff and admins only.
            </p>

            <form onSubmit={signIn} className="mt-5 space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[rgba(191,30,46,0.15)] focus:border-[rgba(191,30,46,1)]"
                  placeholder="you@cherrycreekschools.org"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:ring-4 focus:ring-[rgba(191,30,46,0.15)] focus:border-[rgba(191,30,46,1)]"
                    placeholder="••••••••"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute inset-y-0 right-0 px-3 text-xs text-slate-600 hover:text-slate-900"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {err && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {err}
                </div>
              )}

              {/* Submit */}
              <button
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60 transition"
                style={{
                  background: `linear-gradient(180deg, ${CREEK_RED} 0%, ${CREEK_RED_DARK} 100%)`,
                }}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-1 text-sm">
                <Link
                  href="/"
                  className="text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline"
                >
                  ← Back to site
                </Link>
              </div>
            </form>
          </div>

          {/* Small print */}
          <p className="mt-4 text-xs text-slate-500">
            By signing in, you agree to follow CCHS policies for student
            property and data protection.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small Stat card ---------- */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur p-4">
      <div className="text-xs uppercase tracking-wide text-white/70">
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
