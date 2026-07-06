"use server";

import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rescheduleSchema, type ActionState } from "@/lib/validation";

export async function proposeRescheduleAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = rescheduleSchema.safeParse({
    requestId: formData.get("requestId"),
    preferredAt: formData.get("preferredAt"),
    format: formData.get("format"),
    note: formData.get("note")?.toString(),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("propose_reschedule", {
    target_request_id: parsed.data.requestId,
    new_preferred_at: new Date(parsed.data.preferredAt).toISOString(),
    new_format: parsed.data.format,
    proposal_note: parsed.data.note || undefined,
  });
  if (error) return { error: actionError(error, "The reschedule proposal could not be sent.") };
  revalidatePath("/requests");
  return { success: "Reschedule proposal sent." };
}

export async function respondToRescheduleAction(proposalId: string, response: "accepted" | "declined") {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("respond_to_reschedule", {
    target_proposal_id: proposalId,
    response,
  });
  if (error) return { error: actionError(error, "The proposal could not be updated.") };
  revalidatePath("/requests");
  return { success: true };
}

export async function cancelRescheduleAction(proposalId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("cancel_reschedule", { target_proposal_id: proposalId });
  if (error) return { error: actionError(error, "The proposal could not be cancelled.") };
  revalidatePath("/requests");
  return { success: true };
}
