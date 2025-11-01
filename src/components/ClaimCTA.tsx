"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * Usage on the Item page:
 * <ClaimCTA />
 * Assumes the current page has ?id=ITEM_ID
 */
export function ClaimCTA() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";

  const [authed, setAuthed] = useState<boolean | null>(null);

  // track auth state
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setAuthed(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setAuthed(Boolean(s))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const openHeaderLogin = useCallback(() => {
    document.dispatchEvent(new Event("cc-auth:open"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onClaim = useCallback(() => {
    if (!id) return;
    if (authed) {
      router.push(`/claim?item=${encodeURIComponent(id)}`);
    } else {
      openHeaderLogin();
    }
  }, [authed, id, router, openHeaderLogin]);

  return (
    <button onClick={onClaim} className="btn">
      Claim this item
    </button>
  );
}
