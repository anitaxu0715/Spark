"use server";

import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  feedbackSchema,
  requestSchema,
  requestTransitionSchema,
  type ActionState,
} from "@/lib/validation";
import type { RequestStatus } from "@/types";

export async function createLearningRequestAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = requestSchema.safeParse({
    recipientId: formData.get("recipientId"),
    requestedSkillId: formData.get("requestedSkillId"),
    message: formData.get("message"),
    preferredAt: formData.get("preferredAt"),
    format: formData.get("format"),
    offeredSkillId: formData.get("offeredSkillId"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before sending your request." };

  const values = parsed.data;
  const { error } = await supabase.from("learning_requests").insert({
    sender_id: user.id,
    recipient_id: values.recipientId,
    requested_skill_id: values.requestedSkillId,
    offered_skill_id: values.offeredSkillId || null,
    message: values.message,
    preferred_at: new Date(values.preferredAt).toISOString(),
    format: values.format,
  });
  if (error) {
    const message = actionError(error, "Your learning request could not be sent. Please review it and try again.", {
      "23505": "You already have an active request for this skill.",
      "23514": "The request contains a value that is no longer available.",
      "42501": "This member is not currently available for learning requests.",
    });
    return { error: message };
  }

  revalidatePath("/requests");
  revalidatePath("/notifications");
  return { success: "Your learning request has been sent." };
}

export async function transitionRequestAction(requestId: string, status: RequestStatus, cancellationReason?: string) {
  const parsed = requestTransitionSchema.safeParse({ requestId, status, cancellationReason });
  if (!parsed.success) {
    return { error: "That request status is not supported." };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again to update the request." };

  const { data, error } = await supabase
    .from("learning_requests")
    .update({
      status: parsed.data.status,
      cancellation_reason: parsed.data.status === "cancelled" ? parsed.data.cancellationReason || "Plans changed" : null,
    })
    .eq("id", parsed.data.requestId)
    .select("id")
    .maybeSingle();
  if (error) {
    return {
      error: actionError(error, "This request could not be updated.", {
        "42501": "This request changed or you are not authorized to update it.",
      }),
    };
  }
  if (!data) return { error: "This request changed or you are not authorized to update it." };
  revalidatePath("/requests");
  revalidatePath("/notifications");
  return { success: true };
}

export async function submitFeedbackAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({
    requestId: formData.get("requestId"),
    helpful: formData.get("helpful"),
    comfortableAndRespected: formData.get("comfortableAndRespected"),
    learnTogetherAgain: formData.get("learnTogetherAgain"),
    privateNote: formData.get("privateNote")?.toString(),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again to submit feedback." };
  const values = parsed.data;
  const { error } = await supabase.from("session_feedback").insert({
    request_id: values.requestId,
    user_id: user.id,
    helpful: values.helpful,
    comfortable_and_respected: values.comfortableAndRespected,
    learn_together_again: values.learnTogetherAgain,
    private_note: values.privateNote || null,
  });
  if (error) {
    return {
      error: actionError(error, "Your private feedback could not be saved.", {
        "23505": "You already submitted feedback for this session.",
        "23514": "Feedback is available only to participants in completed sessions.",
        "42501": "You are not authorized to submit feedback for this session.",
      }),
    };
  }
  revalidatePath("/requests");
  return { success: "Thank you. Your feedback is private and has been saved." };
}
