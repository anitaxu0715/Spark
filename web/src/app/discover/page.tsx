import { DiscoveryFilters } from "@/components/discovery/DiscoveryFilters";
import { EmptyState } from "@/components/EmptyState";
import { ProfileCard } from "@/components/ProfileCard";
import { SetupState } from "@/components/SetupState";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getDiscoveryProfiles, getSkills } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireVerifiedMember("/discover");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user) return <SetupState />;
  const raw = await searchParams;
  const values = {
    search: typeof raw.search === "string" ? raw.search : "",
    teaching: typeof raw.teaching === "string" ? raw.teaching : "",
    learning: typeof raw.learning === "string" ? raw.learning : "",
    format: typeof raw.format === "string" ? raw.format : "",
    beginner: typeof raw.beginner === "string" ? raw.beginner : "",
  };

  let profiles;
  let skills;
  try {
    [profiles, skills] = await Promise.all([
      getDiscoveryProfiles(supabase, viewer.user.id),
      getSkills(supabase),
    ]);
  } catch {
    return (
      <div className="page-shell py-16">
        <EmptyState title="Discovery is temporarily unavailable" description="The community directory could not be loaded. Refresh the page or try again shortly." />
      </div>
    );
  }
  const query = values.search.trim().toLowerCase();
  const results = profiles.filter((profile) =>
    (!query || [profile.name, profile.bio, profile.major, ...profile.teachSkills, ...profile.learnSkills].join(" ").toLowerCase().includes(query))
    && (!values.teaching || profile.teachSkillOptions.some((skill) => skill.id === values.teaching))
    && (!values.learning || profile.learnSkillOptions.some((skill) => skill.id === values.learning))
    && (!values.format || profile.format === "either" || profile.format === values.format)
    && (values.beginner !== "true" || profile.beginnerFriendly)
  );

  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-coral-600">Verified community</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl">Follow your curiosity</h1>
        <p className="mt-4 leading-7 text-ink-500">Discover academically verified members through the skills they share and want to learn.</p>
      </div>
      <div className="mt-10"><DiscoveryFilters skills={skills} values={values} /></div>
      <p className="mt-8 text-sm font-semibold text-ink-500" aria-live="polite">{results.length} {results.length === 1 ? "person" : "people"} found</p>
      {results.length ? (
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
        </div>
      ) : (
        <div className="mt-5"><EmptyState title="No profiles match those filters" description="Broaden your search or clear a filter to meet more members." action={{ href: "/discover", label: "Clear filters" }} /></div>
      )}
    </div>
  );
}
