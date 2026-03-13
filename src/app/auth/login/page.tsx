"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BASE } from "@/lib/basePath";
import Link from "next/link";
import { getLiveStats, type LiveStats } from "@/lib/getLiveStats";

const CREEK_RED = "#BF1E2E";
const CREEK_RED_DARK = "#A81524";
const CREEK_NAVY = "#0B2C5C";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [stats, setStats] = useState<LiveStats>({
    totalItems: 0,
    claimed: 0,
    recent: 0,
    claimRate: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const live = await getLiveStats();
        if (!alive) return;
        setStats(live);
      } catch (e) {
        console.error("Failed to load live stats:", e);
      } finally {
        if (alive) setStatsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

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
    <div
      className="min-h-screen text-slate-900 md:grid md:grid-cols-2"
      style={{
        backgroundColor: "#f8fbff",
        backgroundImage:
          "radial-gradient(rgba(11,44,92,0.06) 1px, transparent 1px), linear-gradient(180deg, #fbfdff 0%, #f4f8fd 100%)",
        backgroundSize: "18px 18px, 100% 100%",
      }}
    >
      {/* ---------- Left: Hero image with overlay ---------- */}
      <div className="relative hidden md:flex">
        <div
          className="absolute left-0 top-0 z-20 h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${CREEK_RED} 0%, ${CREEK_RED_DARK} 100%)`,
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${BASE}/images/authHero.png)`,
            backgroundAttachment: "fixed",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 opacity-15 mix-blend-soft-light"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-content-center rounded-xl font-bold shadow"
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

            <p className="max-w-sm text-white/90">
              Fast, fair, and secure—sign in to review claims and keep items
              moving back to their owners.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-white/95">
            <Stat
              label="Total Items"
              value={statsLoading ? "—" : String(stats.totalItems)}
            />
            <Stat
              label="Reunited"
              value={statsLoading ? "—" : String(stats.claimed)}
            />
            <Stat
              label="Claim Rate"
              value={statsLoading ? "—" : `${stats.claimRate}%`}
            />
          </div>
        </div>
      </div>

      {/* ---------- Right: Sign-in Card ---------- */}
      <div className="flex items-start justify-center px-5 pb-10 pt-8 sm:px-8 sm:pt-10 md:items-center md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-5 md:hidden">
            <div className="flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-content-center rounded-xl text-white font-bold shadow"
                style={{ background: CREEK_RED }}
                aria-hidden
              >
                🎒
              </div>
              <div>
                <div className="text-[11px] tracking-wide text-slate-600">
                  Cherry Creek High School
                </div>
                <h1 className="text-xl font-bold leading-tight">
                  Lost &amp; Found — Admin
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(2,6,23,0.06)] sm:p-7">
            <h2 className="text-2xl font-semibold">Admin Sign in</h2>
            <p className="mt-1 text-sm text-slate-600">
              Authorized staff and admins only.
            </p>

            <form onSubmit={signIn} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[rgba(191,30,46,1)] focus:ring-4 focus:ring-[rgba(191,30,46,0.15)]"
                  placeholder="you@cherrycreekschools.org"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pr-14 text-sm outline-none focus:border-[rgba(191,30,46,1)] focus:ring-4 focus:ring-[rgba(191,30,46,0.15)]"
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

              {err && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {err}
                </div>
              )}

              <button
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-60"
                style={{
                  background: `linear-gradient(180deg, ${CREEK_RED} 0%, ${CREEK_RED_DARK} 100%)`,
                }}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <div className="flex items-center justify-between pt-1 text-sm">
                <Link
                  href="/"
                  className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                >
                  ← Back to site
                </Link>
              </div>
            </form>
          </div>

          <p className="mt-3 px-1 text-xs leading-5 text-slate-500">
            By signing in, you agree to follow CCHS policies for student
            property and data protection.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-wide text-white/70">
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
