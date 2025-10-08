"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function Nav() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    const get = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    };
    get();
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
    location.href = "/";
  };
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold">
          Lost &amp; Found
        </Link>
        <Link href="/submit" className="text-sm">
          Report Found Item
        </Link>
        <Link href="/admin" className="text-sm">
          Admin
        </Link>
      </div>
      <div className="text-sm">
        {email ? (
          <button onClick={signOut} className="underline">
            Sign out
          </button>
        ) : (
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
