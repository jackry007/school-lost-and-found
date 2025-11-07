import { supabase } from "@/lib/supabaseClient";

export async function getUid() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id as string | undefined;
}

export async function approveClaimRPC(claimId: number, adminUid: string) {
  const { data, error } = await supabase.rpc("approve_claim", {
    p_claim_id: claimId,
    p_admin: adminUid,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : undefined;
}

export async function requestInfoRPC(
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

export async function rejectClaimRPC(
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

export async function markReturnedRPC(code: string, adminUid: string) {
  const { error } = await supabase.rpc("mark_claim_returned", {
    p_pickup_code: code,
    p_admin: adminUid,
  });
  if (error) throw error;
}

export async function getLatestClaimForItem(itemId: number) {
  const { data, error } = await supabase
    .from("claims")
    .select("id, item_id, status, pickup_code, created_at")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
