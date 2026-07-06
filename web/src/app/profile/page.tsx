import { Avatar } from "@/components/Avatar";
import { SetupState } from "@/components/SetupState";
import { SkillTag } from "@/components/SkillTag";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getCurrentProfile, getSkills } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CurrentProfilePage() {
  const viewer = await requireVerifiedMember("/profile");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user || !viewer.membership) return <SetupState />;
  const [profile, skills] = await Promise.all([getCurrentProfile(supabase, viewer.user.id), getSkills(supabase)]);

  return (
    <div className="page-shell py-12 sm:py-16">
      <div>
        <p className="eyebrow text-coral-600">Your space</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl">My profile</h1>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <section className="rounded-[2rem] bg-indigo-950 p-7 text-white shadow-card">
          <Avatar color={profile.color} initials={profile.initials} size="lg" />
          <h2 className="mt-6 text-3xl font-bold">{profile.name}</h2>
          <p className="mt-2 text-sm font-semibold text-indigo-200">{profile.major} · {profile.university}</p>
          {profile.location && <p className="mt-1 text-sm text-indigo-200">{profile.location}</p>}
          <p className="mt-6 leading-7 text-indigo-100">{profile.bio}</p>
          <div className="mt-6 rounded-2xl bg-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-200">Academic verification</p>
            <p className="mt-1 text-sm font-semibold">Verified {viewer.membership.verified_email_domain}</p>
            <p className="mt-2 text-xs leading-5 text-indigo-200">Verification comes from your confirmed account email and cannot be changed here.</p>
          </div>
        </section>
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-[1.75rem] border border-coral-100 bg-coral-50 p-6">
            <p className="eyebrow text-coral-600">I can share</p>
            <div className="mt-4 flex flex-wrap gap-2">{profile.teachSkills.map((skill) => <SkillTag tone="teach" key={skill}>{skill}</SkillTag>)}</div>
          </section>
          <section className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50 p-6">
            <p className="eyebrow text-indigo-800">I want to learn</p>
            <div className="mt-4 flex flex-wrap gap-2">{profile.learnSkills.map((skill) => <SkillTag tone="learn" key={skill}>{skill}</SkillTag>)}</div>
          </section>
          <section className="rounded-[1.75rem] border border-cream-200 bg-white p-6 shadow-card sm:col-span-2">
            <p className="eyebrow">Profile visibility</p>
            <p className="mt-2 font-semibold text-indigo-950">{profile.discoverable ? "Visible in discovery" : "Hidden from discovery"} · {profile.showLocation ? "Location visible" : "Location hidden"}</p>
          </section>
        </div>
      </div>

      <details className="mt-8 rounded-[2rem] border border-cream-200 bg-white shadow-card">
        <summary className="cursor-pointer list-none rounded-[2rem] p-6 text-xl font-bold text-indigo-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300 sm:p-8">
          Edit profile and preferences
        </summary>
        <div className="border-t border-cream-200 p-6 sm:p-8"><ProfileForm profile={profile} skills={skills} /></div>
      </details>
    </div>
  );
}
