"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { actionError } from "@/lib/action-errors";
import { getSupabaseConfig } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ActionState } from "@/lib/validation";

export async function updateNotificationPreferencesAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before saving preferences." };
  const { error } = await supabase.from("notification_preferences").update({
    request_activity: formData.get("requestActivity") === "on",
    reschedule_activity: formData.get("rescheduleActivity") === "on",
    feedback_reminders: formData.get("feedbackReminders") === "on",
  }).eq("user_id", user.id);
  if (error) return { error: actionError(error, "Notification preferences could not be saved.") };
  revalidatePath("/settings/notifications");
  return { success: "Notification preferences saved." };
}

export async function requestAccountDeletionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get("password")?.toString() ?? "";
  const confirmation = formData.get("confirmation")?.toString() ?? "";
  if (confirmation !== "DELETE") return { fieldErrors: { confirmation: ["Type DELETE exactly."] } };
  if (!password) return { fieldErrors: { password: ["Enter your current password."] } };
  const supabase = await createServerSupabaseClient();
  const config = getSupabaseConfig();
  if (!supabase || !config) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sign in again before deleting your account." };
  const verifier = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { error: signInError } = await verifier.auth.signInWithPassword({ email: user.email, password });
  if (signInError) return { error: "Your current password was not accepted." };
  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: actionError(error, "Account deletion could not be scheduled.") };
  await supabase.auth.signOut();
  redirect("/auth/sign-in?message=deletion-requested");
}

export async function cancelAccountDeletionAction() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.rpc("cancel_account_deletion");
  if (!error) {
    revalidatePath("/account-status");
    redirect("/profile");
  }
}
