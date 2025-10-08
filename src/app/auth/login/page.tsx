// src/app/auth/login/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return alert(error.message);
    location.href = "/admin";
  };

  return (
    <form onSubmit={signIn} className="max-w-sm space-y-3">
      <h1 className="text-2xl font-semibold">Admin Sign in</h1>
      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.6rem;
        }
        .btn {
          background: black;
          color: white;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
        }
      `}</style>
    </form>
  );
}
