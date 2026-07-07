"use server";

import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  profileIdSchema,
  profileSchema,
  reportSchema,
  type ActionState,
} from "@/lib/validation";

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function saveProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    major: formData.get("major"),
    biography: formData.get("biography"),
    location: formData.get("location"),
    availability: formData.get("availability"),
    meetingPreference: formData.get("meetingPreference"),
    beginnerFriendly: checkbox(formData, "beginnerFriendly"),
    learningStyle: formData.get("learningStyle"),
    discoverable: checkbox(formData, "discoverable"),
    showLocation: checkbox(formData, "showLocation"),
    teachingSkillIds: formData.getAll("teachingSkillIds"),
    learningSkillIds: formData.getAll("learningSkillIds"),
    customTeachingSkills: formData.getAll("customTeachingSkills"),
    customLearningSkills: formData.getAll("customLearningSkills"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before saving your profile." };

  const values = parsed.data;
  const { error } = await supabase.rpc("save_my_profile", {
    profile_display_name: values.displayName,
    profile_major: values.major,
    profile_biography: values.biography,
    profile_location: values.location,
    profile_availability: values.availability,
    profile_meeting_preference: values.meetingPreference,
    profile_beginner_friendly: values.beginnerFriendly,
    profile_learning_style: values.learningStyle,
    profile_discoverable: values.discoverable,
    profile_show_location: values.showLocation,
    teaching_skill_ids: values.teachingSkillIds,
    learning_skill_ids: values.learningSkillIds,
    custom_teaching_skill_names: values.customTeachingSkills,
    custom_learning_skill_names: values.customLearningSkills,
  });
  if (error) {
    return {
      error: actionError(error, "Your profile could not be saved. Review the form and try again.", {
        "42501": "Your session no longer has permission to save this profile. Sign in again.",
      }),
    };
  }

  revalidatePath("/profile");
  revalidatePath("/discover");
  return { success: "Your profile has been saved." };
}

export async function toggleSavedProfileAction(profileId: string, shouldSave: boolean) {
  const parsedProfileId = profileIdSchema.safeParse(profileId);
  if (!parsedProfileId.success) return { error: "This profile is not available." };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again to save profiles." };

  const result = shouldSave
    ? await supabase.from("saved_profiles").insert({ owner_id: user.id, profile_id: parsedProfileId.data })
    : await supabase.from("saved_profiles").delete().eq("owner_id", user.id).eq("profile_id", parsedProfileId.data);
  if (result.error) {
    return {
      error: actionError(result.error, "This saved profile could not be updated.", {
        "23505": "This profile is already saved.",
        "42501": "This profile is not available to save.",
      }),
    };
  }
  revalidatePath("/people");
  return { success: true };
}

export async function blockProfileAction(profileId: string) {
  const parsedProfileId = profileIdSchema.safeParse(profileId);
  if (!parsedProfileId.success) return { error: "This profile is not available." };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again to block a profile." };
  const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: parsedProfileId.data });
  if (error) return { error: actionError(error, "This profile could not be blocked.") };
  revalidatePath("/discover");
  revalidatePath("/settings/privacy");
  return { success: true };
}

export async function unblockProfileAction(profileId: string): Promise<void> {
  const parsedProfileId = profileIdSchema.safeParse(profileId);
  if (!parsedProfileId.success) return;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", parsedProfileId.data);
  revalidatePath("/settings/privacy");
}

export async function updatePrivacyAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before updating privacy settings." };
  const { error } = await supabase
    .from("profiles")
    .update({
      discoverable: formData.get("discoverable") === "on",
      show_location: formData.get("showLocation") === "on",
    })
    .eq("id", user.id);
  if (error) return { error: actionError(error, "Your privacy settings could not be saved.") };
  revalidatePath("/settings/privacy");
  revalidatePath("/discover");
  revalidatePath("/profile");
  return { success: "Your privacy settings have been saved." };
}

export async function reportProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reportSchema.safeParse({
    profileId: formData.get("profileId"),
    reason: formData.get("reason"),
    details: formData.get("details")?.toString(),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again to submit a report." };
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    profile_id: parsed.data.profileId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  return error
    ? { error: actionError(error, "Your report could not be submitted. Please try again.") }
    : { success: "Your private report has been submitted." };
}
