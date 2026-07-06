import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PortfolioItem, Profile, Skill } from "@/types";

type Client = SupabaseClient<Database>;

export interface ProfileRow {
  id: string;
  slug: string;
  display_name: string;
  initials: string;
  avatar_color: string;
  major: string;
  biography: string;
  availability_summary: string;
  availability_slots: unknown;
  meeting_preference: Profile["format"];
  beginner_friendly: boolean;
  learning_style: string;
  experience_tags: string[];
  discoverable: boolean;
  show_location: boolean;
  onboarding_completed: boolean;
  universities: { name: string } | null;
}

export interface ProfileSkillRow {
  profile_id: string;
  mode: "teach" | "learn";
  skills: Skill | null;
}

function portfolioFor(skills: string[]): PortfolioItem[] {
  const first = skills[0] ?? "Peer learning";
  const second = skills[1] ?? "Practice notes";
  return [
    { title: `${first} starter`, description: `A practical example showing how this member approaches ${first.toLowerCase()}.` },
    { title: `${second} notes`, description: "A small collection of exercises, references, and lessons learned." },
  ];
}

export function mapProfileRows(
  rows: ProfileRow[],
  skillRows: ProfileSkillRow[],
  locations: Array<{ profile_id: string; general_location: string }>,
): Profile[] {
  const skillsByProfile = new Map<string, ProfileSkillRow[]>();
  skillRows.forEach((row) => skillsByProfile.set(row.profile_id, [...(skillsByProfile.get(row.profile_id) ?? []), row]));
  const locationByProfile = new Map(locations.map((item) => [item.profile_id, item.general_location]));

  return rows.map((row) => {
    const relatedSkills = skillsByProfile.get(row.id) ?? [];
    const teachSkillOptions = relatedSkills.filter((item) => item.mode === "teach" && item.skills).map((item) => item.skills as Skill);
    const learnSkillOptions = relatedSkills.filter((item) => item.mode === "learn" && item.skills).map((item) => item.skills as Skill);
    const teachSkills = teachSkillOptions.map((skill) => skill.name);
    return {
      id: row.id,
      slug: row.slug,
      name: row.display_name,
      initials: row.initials,
      university: row.universities?.name ?? "Verified academic member",
      major: row.major,
      location: locationByProfile.get(row.id) ?? null,
      bio: row.biography,
      teachSkills,
      learnSkills: learnSkillOptions.map((skill) => skill.name),
      teachSkillOptions,
      learnSkillOptions,
      format: row.meeting_preference,
      beginnerFriendly: row.beginner_friendly,
      availability: {
        summary: row.availability_summary,
        timeSlots: Array.isArray(row.availability_slots)
          ? row.availability_slots.filter((item): item is string => typeof item === "string")
          : [],
      },
      style: row.learning_style,
      tags: row.experience_tags,
      color: row.avatar_color,
      portfolio: portfolioFor(teachSkills),
      discoverable: row.discoverable,
      showLocation: row.show_location,
      onboardingCompleted: row.onboarding_completed,
    };
  });
}

async function enrichProfiles(supabase: Client, rows: ProfileRow[]) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [{ data: skillRows, error: skillError }, { data: locations, error: locationError }] = await Promise.all([
    supabase.from("profile_skills").select("profile_id, mode, skills(id, name, category)").in("profile_id", ids),
    supabase.from("profile_locations").select("profile_id, general_location").in("profile_id", ids),
  ]);
  if (skillError || locationError) throw new Error("Profiles could not be loaded.");
  return mapProfileRows(
    rows,
    (skillRows ?? []) as unknown as ProfileSkillRow[],
    locations ?? [],
  );
}

const profileSelection = `
  id, slug, display_name, initials, avatar_color, major, biography,
  availability_summary, availability_slots, meeting_preference,
  beginner_friendly, learning_style, experience_tags, discoverable,
  show_location, onboarding_completed, universities(name)
`;

export async function getDiscoveryProfiles(supabase: Client, currentUserId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelection)
    .neq("id", currentUserId)
    .eq("discoverable", true)
    .eq("onboarding_completed", true)
    .order("display_name");
  if (error) throw new Error("Discovery profiles could not be loaded.");
  return enrichProfiles(supabase, (data ?? []) as unknown as ProfileRow[]);
}

export async function getProfileBySlug(supabase: Client, slug: string, currentUserId: string) {
  const { data, error } = await supabase.from("profiles").select(profileSelection).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  const [profile] = await enrichProfiles(supabase, [data as unknown as ProfileRow]);
  const { data: saved } = await supabase
    .from("saved_profiles")
    .select("profile_id")
    .eq("owner_id", currentUserId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  return { ...profile, saved: Boolean(saved) };
}

export async function getCurrentProfile(supabase: Client, userId: string) {
  const { data, error } = await supabase.from("profiles").select(profileSelection).eq("id", userId).single();
  if (error) throw new Error("Your profile could not be loaded.");
  const [profile] = await enrichProfiles(supabase, [data as unknown as ProfileRow]);
  return profile;
}

export async function getSkills(supabase: Client) {
  const { data, error } = await supabase.from("skills").select("id, name, category").eq("active", true).order("category").order("name");
  if (error) throw new Error("The skill catalog could not be loaded.");
  return data as Skill[];
}
