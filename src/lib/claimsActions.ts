// src/lib/claimActions.ts
import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   Approve / Request Info / Reject
   ======================================================= */

export async function approveClaim(claimId: number, adminUid: string) {
  const { data, error } = await supabase.rpc("approve_claim", {
    p_claim_id: claimId,
    p_admin: adminUid,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : undefined;
  return row as
    | { claim_id: number; item_id: number; pickup_code?: string; hold_until?: string }
    | undefined;
}

export async function requestInfoClaim(
  claimId: number,
  adminUid: string,
  msg?: string
) {
  const { error } = await supabase.rpc("request_info_claim", {
    p_claim_id: claimId,
    p_admin: adminUid,
    p_msg: msg ?? null,
  });
  if (error) throw error;
}

export async function rejectClaim(
  claimId: number,
  adminUid: string,
  reason?: string
) {
  const { error } = await supabase.rpc("reject_claim", {
    p_claim_id: claimId,
    p_admin: adminUid,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

/* =========================================================
   Mark Picked Up (No Code Required)
   ======================================================= */

export async function markClaimPickedUp(claimId: number, adminUid: string) {
  const { error } = await supabase.rpc("mark_claim_picked_up", {
    p_claim_id: claimId,
    p_admin: adminUid,
  });
  if (error) throw error;
}
