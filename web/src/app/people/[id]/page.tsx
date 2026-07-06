import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ProfileActions } from "@/components/ProfileActions";
import { SafetyNotice } from "@/components/SafetyNotice";
import { SetupState } from "@/components/SetupState";
import { SkillTag } from "@/components/SkillTag";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getCurrentProfile, getProfileBySlug } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ")} — Member profile` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id: slug } = await params;
  const viewer = await requireVerifiedMember(`/people/${slug}`);
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user) return <SetupState />;

  const [profile, currentProfile] = await Promise.all([
    getProfileBySlug(supabase, slug, viewer.user.id),
    getCurrentProfile(supabase, viewer.user.id),
  ]);
  if (!profile || profile.id === viewer.user.id) notFound();
  const format = profile.format === "either" ? "Online or in person" : profile.format === "online" ? "Online" : "In person";

  return (
    <div className="page-shell py-10 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar color={profile.color} initials={profile.initials} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight text-indigo-950">{profile.name}</h1>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">Academically verified</span>
                  {profile.beginnerFriendly && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Beginner-friendly</span>}
                </div>
                <p className="mt-2 font-semibold text-indigo-800">{profile.major} · {profile.university}</p>
                {profile.location && <p className="mt-2 text-sm text-ink-500">{profile.location}</p>}
              </div>
            </div>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-600">{profile.bio}</p>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-coral-100 bg-coral-50 p-6">
              <p className="eyebrow text-coral-600">Skills I can share</p>
              <div className="mt-4 flex flex-wrap gap-2">{profile.teachSkills.map((skill) => <SkillTag tone="teach" key={skill}>{skill}</SkillTag>)}</div>
            </div>
            <div className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50 p-6">
              <p className="eyebrow text-indigo-800">Skills I want to learn</p>
              <div className="mt-4 flex flex-wrap gap-2">{profile.learnSkills.map((skill) => <SkillTag tone="learn" key={skill}>{skill}</SkillTag>)}</div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-2xl font-bold text-indigo-950">How we could learn together</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div><dt className="eyebrow">Availability</dt><dd className="mt-2 font-semibold text-indigo-950">{profile.availability.summary}</dd></div>
              <div><dt className="eyebrow">Meeting format</dt><dd className="mt-2 font-semibold text-indigo-950">{format}</dd></div>
              <div className="sm:col-span-2"><dt className="eyebrow">Style</dt><dd className="mt-2 font-semibold text-indigo-950">{profile.style}</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">{profile.tags.map((tag) => <SkillTag key={tag}>{tag}</SkillTag>)}</div>
          </section>

          <section>
            <p className="eyebrow text-coral-600">A little of their work</p>
            <h2 className="mt-3 text-2xl font-bold text-indigo-950">Portfolio snapshots</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {profile.portfolio.map((item, index) => (
                <article className="overflow-hidden rounded-[1.75rem] border border-cream-200 bg-white shadow-card" key={item.title}>
                  <div className={`grid h-36 place-items-center ${index % 2 ? "bg-indigo-100" : "bg-coral-100"}`}><span className="text-3xl text-indigo-800" aria-hidden="true">✦</span></div>
                  <div className="p-5"><h3 className="font-bold text-indigo-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p></div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="lg:sticky lg:top-26 lg:self-start">
          <div className="rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card">
            <p className="text-xl font-bold text-indigo-950">Interested in {profile.teachSkills[0]}?</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">Send a specific, friendly note. They can accept or decline without pressure.</p>
            <div className="mt-6"><ProfileActions offeredSkills={currentProfile.teachSkillOptions} profile={profile} /></div>
          </div>
          <div className="mt-5"><SafetyNotice /></div>
        </aside>
      </div>
    </div>
  );
}
