import { redirect } from "next/navigation";
import { SetupState } from "@/components/SetupState";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getCurrentProfile, getSkills } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const viewer = await requireVerifiedMember("/onboarding");
  if (!viewer.configured) return <SetupState />;
  if (viewer.profile?.onboarding_completed) redirect("/profile");
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user) return <SetupState />;
  const [profile, skills] = await Promise.all([getCurrentProfile(supabase, viewer.user.id), getSkills(supabase)]);

  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="eyebrow text-coral-600">Verified account · Profile setup</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl">Make room for what you know and what you wonder</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-ink-500">Your profile becomes discoverable only after every required field and skill relationship is saved successfully.</p>
        </div>
        <section className="mt-9 rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
          <ProfileForm onboarding profile={profile} skills={skills} />
        </section>
      </div>
    </div>
  );
}
