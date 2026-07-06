import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/validation";

export type OperationalRole = "moderator" | "institution_admin" | "platform_admin";

type AccessState = {
  restricted: boolean;
  restriction: { type: string; starts_at: string; expires_at: string | null } | null;
  deletion_pending: boolean;
  deletion: { id: string; requested_at: string; purge_after: string } | null;
};

export const getViewer = cache(async () => {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { configured: false as const, user: null, profile: null, membership: null, roles: [] as OperationalRole[], access: null };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { configured: true as const, user: null, profile: null, membership: null, roles: [] as OperationalRole[], access: null };

  const [{ data: profile }, { data: membership }, { data: roleRows }, { data: access }] = await Promise.all([
    supabase.from("profiles").select("id, slug, display_name, initials, onboarding_completed").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("user_id, university_id, verified_email_domain, verified_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.rpc("get_my_access_state"),
  ]);

  return {
    configured: true as const,
    user,
    profile,
    membership,
    roles: (roleRows ?? []).map((row) => row.role) as OperationalRole[],
    access: access as AccessState | null,
  };
});

export async function requireVerifiedMember(intendedPath?: string) {
  const viewer = await getViewer();
  if (!viewer.configured) return viewer;
  if (!viewer.user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(safeRedirectPath(intendedPath, "/discover"))}`);
  }
  if (!viewer.membership) redirect("/verify-email");
  if (!viewer.profile?.onboarding_completed && intendedPath !== "/onboarding") redirect("/onboarding");
  if (
    (viewer.access?.restricted || viewer.access?.deletion_pending)
    && intendedPath !== "/account-status"
    && intendedPath !== "/settings/account"
  ) redirect("/account-status");
  return viewer;
}

export async function requireOperationalRole(allowed: OperationalRole[], intendedPath: string) {
  const viewer = await requireVerifiedMember(intendedPath);
  if (!viewer.configured) return viewer;
  if (!viewer.roles.some((role) => allowed.includes(role))) redirect("/discover");
  return viewer;
}
