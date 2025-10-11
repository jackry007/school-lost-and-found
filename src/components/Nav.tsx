"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Nav() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    };
    getUser();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-red-700 text-white shadow-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side — Brand & links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg sm:text-xl font-semibold tracking-tight hover:text-yellow-200 transition-colors"
          >
            🎒 Lost & Found
          </Link>

          <div className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link
              href="/submit"
              className="hover:text-yellow-200 transition-colors"
            >
              Report Found Item
            </Link>
            <Link
              href="/browse"
              className="hover:text-yellow-200 transition-colors"
            >
              Browse Items
            </Link>
            <Link
              href="/admin"
              className="hover:text-yellow-200 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>

        {/* Right side — Auth actions */}
        <div className="flex items-center gap-3 text-sm font-medium">
          {email ? (
            <>
              <span className="hidden sm:inline">{email}</span>
              <button
                onClick={signOut}
                className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md bg-yellow-400 px-3 py-1.5 font-semibold text-red-800 hover:bg-yellow-300 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
