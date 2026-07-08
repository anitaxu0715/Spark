"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-errors";
import { getSupabaseConfig } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  emailSchema,
  extractEmailDomain,
  passwordSchema,
  safeRedirectPath,
  signInSchema,
  signUpSchema,
  type ActionState,
} from "@/lib/validation";

const configurationMessage = "Spark is not connected to Supabase. Complete the local environment setup and try again.";

function inviteHash(inviteCode: string) {
  return createHash("sha256").update(inviteCode.trim().toLowerCase()).digest("hex");
}

export async function signUpAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    inviteCode: formData.get("inviteCode"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createServerSupabaseClient();
  const config = getSupabaseConfig();
  if (!supabase || !config) return { error: configurationMessage };

  const domain = extractEmailDomain(parsed.data.email);
  if (!domain) return { fieldErrors: { email: ["Enter a valid email address."] } };
  const { data: eligibleDomain, error: domainError } = await supabase
    .from("university_domains")
    .select("domain")
    .eq("domain", domain)
    .maybeSingle();

  if (domainError) return { error: "Academic eligibility could not be checked. Please try again." };
  let inviteCodeHash: string | null = null;
  if (!eligibleDomain) {
    const inviteCode = parsed.data.inviteCode?.trim();
    if (!inviteCode) {
      return { fieldErrors: { inviteCode: ["Use a valid invite code with non-academic email addresses."] } };
    }
    inviteCodeHash = inviteHash(inviteCode);
    const { data: inviteValid, error: inviteError } = await supabase.rpc("validate_invite_code", {
      invite_code_hash: inviteCodeHash,
    });
    if (inviteError) return { error: "Invite eligibility could not be checked. Please try again." };
    if (!inviteValid) return { fieldErrors: { inviteCode: ["This invite code is invalid, expired, or fully used."] } };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${config.siteUrl}/auth/confirm?next=/onboarding`,
      data: {
        display_name: parsed.data.email.split("@")[0],
        ...(inviteCodeHash ? { invite_code_hash: inviteCodeHash } : {}),
      },
    },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("already")
      ? "If this address is eligible, check your inbox or try signing in."
      : actionError(error, "Your account could not be created. Please wait a moment and try again.");
    return { error: message };
  }

  redirect("/verify-email?new=1");
}

export async function signInAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: configurationMessage };

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "The email or password is incorrect, or the email has not been confirmed." };

  const next = safeRedirectPath(formData.get("next")?.toString(), "/discover");
  const [{ data: membership }, { data: profile }, { data: access }] = await Promise.all([
    supabase.from("memberships").select("user_id").eq("user_id", data.user.id).maybeSingle(),
    supabase.from("profiles").select("onboarding_completed").eq("id", data.user.id).maybeSingle(),
    supabase.rpc("get_my_access_state"),
  ]);

  if (!membership) redirect("/verify-email");
  if (!profile?.onboarding_completed) redirect("/onboarding");
  const accessState = access as { restricted?: boolean; deletion_pending?: boolean } | null;
  if (accessState?.restricted || accessState?.deletion_pending) redirect("/account-status");
  redirect(next);
}

export async function forgotPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues.map((issue) => issue.message) } };

  const supabase = await createServerSupabaseClient();
  const config = getSupabaseConfig();
  if (!supabase || !config) return { error: configurationMessage };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${config.siteUrl}/auth/confirm?next=/auth/update-password`,
  });
  if (error) return { error: "The reset email could not be requested. Please wait a moment and try again." };

  return { success: "If an account exists for that address, a password reset link is on its way." };
}

export async function updatePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues.map((issue) => issue.message) } };
  if (password !== confirmPassword) return { fieldErrors: { confirmPassword: ["Passwords do not match."] } };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: configurationMessage };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "This reset link has expired. Request a new password reset email." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: "Your password could not be updated. Request a new recovery email and try again." };
  return { success: "Your password has been updated. You can continue using Spark." };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
