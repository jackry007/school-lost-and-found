"use client";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErrorMsg(error.message);
    else router.push("/claim"); // redirect after login
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 border rounded-xl bg-white shadow">
      <h1 className="text-xl font-semibold mb-4 text-center">Sign In</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@cherrycreekschools.org"
          className="w-full rounded-xl border p-3"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border p-3"
        />
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#BF1E2E] text-white py-2 font-medium"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}
