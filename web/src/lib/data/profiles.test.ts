import { describe, expect, it } from "vitest";
import { mapProfileRows, type ProfileRow, type ProfileSkillRow } from "@/lib/data/profiles";

describe("profile DTO mapping", () => {
  it("maps only safe selected profile fields and respects absent location rows", () => {
    const row: ProfileRow = {
      id: "profile-1",
      slug: "sample-member",
      display_name: "Sample Member",
      initials: "SM",
      avatar_color: "coral",
      major: "Design",
      biography: "A helpful biography.",
      availability_summary: "Weekends",
      availability_slots: ["Saturday"],
      meeting_preference: "either",
      beginner_friendly: true,
      learning_style: "Practical",
      experience_tags: ["Patient"],
      discoverable: true,
      show_location: false,
      onboarding_completed: true,
      universities: { name: "Sample University" },
    };
    const skills: ProfileSkillRow[] = [
      { profile_id: "profile-1", mode: "teach", skills: { id: "skill-1", name: "Photography", category: "Creative" } },
    ];

    const [profile] = mapProfileRows([row], skills, []);
    expect(profile.location).toBeNull();
    expect(profile.teachSkills).toEqual(["Photography"]);
    expect(profile.university).toBe("Sample University");
    expect(profile).not.toHaveProperty("email");
  });
});
