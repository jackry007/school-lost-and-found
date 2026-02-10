// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Menu } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import MessagesPortal from "@/components/MessagesPortal";
import { useAuthUI } from "@/components/AuthUIProvider";

const CREEK_RED = "#BF1E2E";
const CREEK_NAVY = "#0B2C5C";

// Notice bar timing
const NOTICE_NEXT_SHOW_KEY = "cc-lostfound-notice:nextShowAt:v1";
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function shouldShowNoticeNow(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(NOTICE_NEXT_SHOW_KEY);
  if (!raw) return true;
  const nextShowAt = parseInt(raw, 10) || 0;
  return Date.now() >= nextShowAt;
}

type AuthState = "loading" | "guest" | "authed";
type ProfileRole = "admin" | "staff" | "user";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [showNotice, setShowNotice] = useState<null | boolean>(null);

  // ✅ Pin logic
  const [pinned, setPinned] = useState(false);

  // ✅ Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  // ===== Auth state =====
  const [auth, setAuth] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<ProfileRole | null>(null);

  // ✅ Shared panel state via provider
  const { panelOpen, openPanel, closePanel, redirectTo, clearRedirect } =
    useAuthUI();

  // login panel DOM ref for click-outside
  const panelRef = useRef<HTMLDivElement>(null);

  const [emailInput, setEmailInput] = useState("");
  const [pwdInput, setPwdInput] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginErr, setLoginErr] = useState<string | null>(null);

  // Scroll shadow + compact height
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Notice display
  useEffect(() => {
    setShowNotice(shouldShowNoticeNow());
  }, []);

  // ✅ Observe school logo visibility
  useEffect(() => {
    const el = document.getElementById("school-logo");
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setPinned(!entry.isIntersecting);
      },
      { root: null, threshold: 0.01 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Click outside mobile menu
  useEffect(() => {
    if (!mobileOpen) return;

    function onClick(e: MouseEvent) {
      if (!mobileRef.current) return;
      if (!mobileRef.current.contains(e.target as Node)) setMobileOpen(false);
    }

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [mobileOpen]);

  // Auth load + listener
  useEffect(() => {
    const loadAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setAuth(u ? "authed" : "guest");
      setUserEmail(u?.email ?? null);

      if (!u) {
        setRole(null);
        return;
      }

      // fetch role from profiles
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("uid", u.id)
        .single();

      setRole((prof?.role as ProfileRole) ?? "user");
    };

    loadAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evt, session) => {
        const u = session?.user ?? null;
        setAuth(u ? "authed" : "guest");
        setUserEmail(u?.email ?? null);

        if (!u) {
          setRole(null);
          return;
        }

        // close panel on successful auth
        closePanel();

        // refresh role
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("uid", u.id)
          .single();

        setRole((prof?.role as ProfileRole) ?? "user");
      },
    );

    return () => sub.subscription.unsubscribe();
  }, [closePanel]);

  // Click outside login panel
  useEffect(() => {
    if (!panelOpen) return;

    function onClick(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) closePanel();
    }

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [panelOpen, closePanel]);

  // ✅ Guarded navigation: if guest -> open login panel and remember target
  function guardedGo(targetHref: string) {
    if (auth === "authed") {
      router.push(targetHref);
      return;
    }
    openPanel(targetHref);
  }

  // Handle login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(null);

    setLoginBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: pwdInput,
    });
    setLoginBusy(false);

    if (error) {
      setLoginErr(error.message);
      return;
    }

    // ✅ Fetch role immediately after login
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    if (uid) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("uid", uid)
        .single();

      setRole((prof?.role as ProfileRole) ?? "user");
    }

    setEmailInput("");
    setPwdInput("");
    closePanel();

    // ✅ If they clicked a protected link before signing in, send them there now
    if (redirectTo) {
      const to = redirectTo;
      clearRedirect();
      router.push(to);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setRole(null);
    setUserEmail(null);
    setAuth("guest");
    router.push("/");
  }

  // Nav items
  const nav = useMemo(
    () => [
      { href: "/", label: "Lost & Found", guard: false },
      { href: "/report", label: "Report Found Item", guard: true },
      { href: "/admin", label: "Admin", guard: false },
    ],
    [],
  );

  // Reserve space when pinned so content doesn't jump
  const headerH = scrolled ? 56 : 64; // h-14 / h-16

  return (
    <>
      {pinned && <div aria-hidden="true" style={{ height: headerH }} />}

      <header
        className={[
          pinned ? "fixed" : "relative",
          "top-0 left-0 right-0 z-[9999] w-full text-white transition-all duration-300",
          scrolled
            ? "shadow-[0_6px_18px_rgba(0,0,0,.18)]"
            : "shadow-[0_10px_28px_rgba(0,0,0,.12)]",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(180deg, rgba(191,30,46,0.985) 0%, rgba(168,21,36,0.985) 100%)",
          borderBottom: "1px solid rgba(0,0,0,.18)",
        }}
      >
        <div
          className={[
            "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
            scrolled ? "h-14" : "h-16",
          ].join(" ")}
        >
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 sm:gap-7">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-lg px-2 py-1 transition no-underline decoration-0"
              aria-label="Cherry Creek Lost & Found Home"
            >
              <span className="text-2xl leading-none">🎒</span>
              <div className="leading-tight max-w-[150px] sm:max-w-none">
                <div className="text-[16px] font-extrabold tracking-tight truncate">
                  Cherry Creek
                </div>
                <div className="text-[12px] font-medium text-white/90 truncate">
                  Lost &amp; Found
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1.5">
              {nav.map((n) => {
                const active = pathname === n.href;

                if (n.guard) {
                  return (
                    <button
                      key={n.href}
                      type="button"
                      onClick={() => guardedGo(n.href)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "relative group rounded-full px-4 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-yellow-400 text-red-900 shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]"
                          : "text-white/90 hover:bg-white/15 hover:text-white",
                      ].join(" ")}
                    >
                      {n.label}
                      <span
                        className={[
                          "pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-1 h-[3px] w-10 rounded-full transition-all",
                          active
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100",
                        ].join(" ")}
                        style={{
                          backgroundColor: active
                            ? "#6E0F16"
                            : "rgba(255,255,255,.9)",
                        }}
                      />
                    </button>
                  );
                }

                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative group rounded-full px-4 py-2 text-sm font-semibold transition no-underline decoration-0",
                      active
                        ? "bg-yellow-400 text-red-900 shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]"
                        : "text-white/90 hover:bg-white/15 hover:text-white",
                    ].join(" ")}
                  >
                    {n.label}
                    <span
                      className={[
                        "pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-1 h-[3px] w-10 rounded-full transition-all",
                        active
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100",
                      ].join(" ")}
                      style={{
                        backgroundColor: active
                          ? "#6E0F16"
                          : "rgba(255,255,255,.9)",
                      }}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Mobile menu + Search + Auth */}
          <div className="relative flex items-center gap-3" ref={mobileRef}>
            {/* ✅ Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className={[
                "md:hidden inline-flex items-center justify-center",
                "rounded-full px-3 py-2",
                "border border-white/30 bg-white/10 hover:bg-white/18",
                "focus:outline-none focus:ring-2 focus:ring-white/60 transition",
              ].join(" ")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              title={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Search chip (guarded) */}
            <button
              type="button"
              onClick={() => guardedGo("/search")}
              className={[
                "inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm font-medium",
                "border border-white/30 bg-white/10 hover:bg-white/18",
                "focus:outline-none focus:ring-2 focus:ring-white/60 transition",
              ].join(" ")}
              aria-label="Search items"
              title="Search items"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </button>

            {auth === "loading" && (
              <span className="rounded-full px-3 py-2 text-sm border border-white/30 bg-white/10">
                Checking…
              </span>
            )}

            {auth === "guest" && (
              <div className="relative" ref={panelRef}>
                <button
                  type="button"
                  onClick={() => (panelOpen ? closePanel() : openPanel())}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/30 bg-white/10 hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/60 transition"
                  aria-expanded={panelOpen}
                  aria-controls="login-panel"
                >
                  Sign in
                </button>

                {panelOpen && (
                  <div
                    id="login-panel"
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/25 bg-white/95 text-gray-900 shadow-xl backdrop-blur p-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-800">
                      Sign in to continue
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      Use your <b>@cherrycreekschools.org</b> email.
                    </p>

                    <form onSubmit={handleLogin} className="mt-3 space-y-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@cherrycreekschools.org"
                        required
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2"
                      />
                      <input
                        type="password"
                        value={pwdInput}
                        onChange={(e) => setPwdInput(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2"
                      />

                      {loginErr && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {loginErr}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loginBusy}
                        className="w-full rounded-xl bg-[#BF1E2E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                      >
                        {loginBusy ? "Signing in…" : "Sign In"}
                      </button>
                    </form>

                    <button
                      className="absolute right-2 top-2 rounded p-1 text-gray-500 hover:bg-gray-100"
                      aria-label="Close"
                      onClick={closePanel}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {auth === "authed" && (
              <div className="flex items-center gap-2">
                <MessagesPortal />

                <span
                  className="hidden sm:inline max-w-[170px] truncate rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm"
                  title={userEmail ?? ""}
                >
                  {userEmail}
                </span>

                <button
                  onClick={handleLogout}
                  className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm hover:bg-white/18 transition"
                  title="Sign out"
                  type="button"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Mobile dropdown nav */}
        <div
          id="mobile-nav"
          className={[
            "md:hidden overflow-hidden transition-[max-height] duration-300 ease-out",
            mobileOpen ? "max-h-72" : "max-h-0",
          ].join(" ")}
        >
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-2">
              <div className="grid gap-2">
                {nav.map((n) => {
                  const active = pathname === n.href;

                  if (n.guard) {
                    return (
                      <button
                        key={n.href}
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          guardedGo(n.href);
                        }}
                        className={[
                          "w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition",
                          active
                            ? "bg-yellow-400 text-red-900"
                            : "text-white hover:bg-white/15",
                        ].join(" ")}
                      >
                        {n.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "no-underline decoration-0 block rounded-xl px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "bg-yellow-400 text-red-900"
                          : "text-white hover:bg-white/15",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </div>

              {/* Optional: show signed-in email on mobile */}
              {auth === "authed" && userEmail && (
                <div className="mt-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90 truncate">
                  Signed in as:{" "}
                  <span className="font-semibold">{userEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="h-0.5 w-full"
          style={{ backgroundColor: `${CREEK_NAVY}EE` }}
        />
      </header>

      {/* These scroll normally (NOT pinned) */}
      <div
        className="h-8 w-full shadow-[inset_0_-1px_0_rgba(0,0,0,.08)]"
        style={{
          background:
            "repeating-linear-gradient(135deg, #BF1E2E 0 16px, #0B2C5C 16px 32px)",
        }}
      />

      {showNotice === true && (
        <div
          role="region"
          aria-label="Important notice"
          className="relative bg-yellow-50 border-y border-yellow-200 text-center text-sm sm:text-base text-yellow-900 py-2 pl-4 pr-12 shadow-sm transition-opacity duration-300 ease-out"
        >
          ⚠️ <span className="font-semibold">Important Notice:</span> Items
          unclaimed after <strong>60 days</strong> may be donated or disposed of
          according to school policy.
          <button
            type="button"
            aria-label="Dismiss important notice"
            onClick={() => {
              setShowNotice(false);
              try {
                window.localStorage.setItem(
                  NOTICE_NEXT_SHOW_KEY,
                  String(Date.now() + ONE_DAY_MS),
                );
              } catch {}
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md p-2 text-yellow-900/80 hover:text-yellow-900 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 transition"
            title="Dismiss"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
