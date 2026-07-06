import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SkillTag } from "@/components/SkillTag";
import type { Profile } from "@/types";

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="group flex h-full flex-col rounded-[1.75rem] border border-cream-200 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-coral-200 hover:shadow-card-hover">
      <div className="flex items-start gap-4">
        <Avatar initials={profile.initials} color={profile.color} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-indigo-950">{profile.name}</h3>
          <p className="mt-0.5 text-sm text-ink-500">{profile.major}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">{profile.location}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-600">{profile.bio}</p>
      <div className="mt-5">
        <p className="eyebrow">Can share</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.teachSkills.slice(0, 3).map((skill) => (
            <SkillTag tone="teach" key={skill}>{skill}</SkillTag>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-ink-500">
        <span>{profile.format === "either" ? "Online or in person" : profile.format === "online" ? "Online" : "In person"}</span>
        <span aria-hidden="true">•</span>
        <span>{profile.availability.summary}</span>
      </div>
      <div className="mt-auto pt-6">
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-900 transition group-hover:border-coral-300 group-hover:bg-coral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300"
          href={`/people/${profile.slug}`}
        >
          View {profile.name.split(" ")[0]}&apos;s profile
        </Link>
      </div>
    </article>
  );
}
