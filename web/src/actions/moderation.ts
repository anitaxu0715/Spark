"use server";

import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { moderationCaseSchema, restrictionSchema, type ActionState } from "@/lib/validation";

export async function updateModerationCaseAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = moderationCaseSchema.safeParse({
    caseId: formData.get("caseId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    reason: formData.get("reason")?.toString(),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("moderation_update_case", {
    target_case_id: parsed.data.caseId,
    next_status: parsed.data.status,
    next_priority: parsed.data.priority,
    transition_reason: parsed.data.reason || undefined,
  });
  if (error) return { error: actionError(error, "The moderation case could not be updated.") };
  revalidatePath("/moderation");
  return { success: "Case updated." };
}

export async function addModerationNoteAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const caseId = formData.get("caseId")?.toString() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (!body || body.length > 2000) return { fieldErrors: { body: ["Enter a note between 3 and 2,000 characters."] } };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("moderation_add_note", { target_case_id: caseId, note_body: body });
  if (error) return { error: actionError(error, "The internal note could not be added.") };
  revalidatePath(`/moderation/cases/${caseId}`);
  return { success: "Internal note added." };
}

export async function applyRestrictionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = restrictionSchema.safeParse({
    caseId: formData.get("caseId"),
    userId: formData.get("userId"),
    type: formData.get("type"),
    reason: formData.get("reason"),
    expiresAt: formData.get("expiresAt")?.toString(),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const expiresAt = parsed.data.type === "temporary_suspension" && parsed.data.expiresAt
    ? new Date(parsed.data.expiresAt).toISOString()
    : undefined;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("moderation_apply_restriction", {
    target_case_id: parsed.data.caseId,
    target_user: parsed.data.userId,
    selected_type: parsed.data.type,
    restriction_reason: parsed.data.reason,
    restriction_expires_at: expiresAt,
  });
  if (error) return { error: actionError(error, "The restriction could not be applied.") };
  revalidatePath(`/moderation/cases/${parsed.data.caseId}`);
  return { success: "Restriction applied." };
}

export async function revokeRestrictionAction(restrictionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.rpc("moderation_revoke_restriction", { target_restriction_id: restrictionId });
  revalidatePath("/moderation");
}
