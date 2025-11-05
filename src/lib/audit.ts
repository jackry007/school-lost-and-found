import { supabase } from "@/lib/supabaseClient";

export type AuditAction =
  | "approve_claim"
  | "reject_claim"
  | "request_info"
  | "mark_picked_up"
  | "item_listed"
  | "item_rejected"
  | "item_released_hold"
  | "item_updated"
  | "schedule_set"
  | "schedule_cleared"
  | "message_sent";

export async function logEvent(
  action: AuditAction,
  entityType: "item" | "claim" | "message",
  entityId: number | null,
  details?: Record<string, any>
) {
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : null;
  const { error } = await supabase.from("audit_log").insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details ?? {},
    user_agent: userAgent,
  });
  if (error) console.warn("audit log insert failed:", error.message);
}
