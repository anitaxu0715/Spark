import { describe, expect, it } from "vitest";
import {
  extractEmailDomain,
  feedbackSchema,
  domainSchema,
  moderationCaseSchema,
  profileSchema,
  requestSchema,
  rescheduleSchema,
  safeRedirectPath,
  signUpSchema,
} from "@/lib/validation";

describe("authentication validation", () => {
  it("normalizes a valid academic email domain", () => {
    expect(extractEmailDomain("  Student@UW.EDU ")).toBe("uw.edu");
  });

  it("rejects malformed email addresses", () => {
    expect(extractEmailDomain("not-an-email")).toBeNull();
  });

  it("requires matching strong passwords", () => {
    const result = signUpSchema.safeParse({
      email: "student@uw.edu",
      password: "weak",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional invite code during signup", () => {
    const result = signUpSchema.safeParse({
      email: "friend@gmail.com",
      password: "StrongPass!2026",
      confirmPassword: "StrongPass!2026",
      inviteCode: "  local-gmail-invite-2026  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.inviteCode).toBe("local-gmail-invite-2026");
  });
});

describe("Phase 3 operational validation", () => {
  it("requires a future, specific reschedule proposal", () => {
    expect(rescheduleSchema.safeParse({
      requestId: "40000000-0000-4000-8000-000000000001",
      preferredAt: "2020-01-01T10:00",
      format: "online",
    }).success).toBe(false);
  });

  it("accepts only known moderation states", () => {
    expect(moderationCaseSchema.safeParse({
      caseId: "90000000-0000-4000-8000-000000000100",
      status: "deleted",
      priority: "urgent",
    }).success).toBe(false);
  });

  it("normalizes and validates institution domains", () => {
    const result = domainSchema.safeParse({
      universityId: "10000000-0000-4000-8000-000000000001",
      domain: " UW.EDU ",
      development: false,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.domain).toBe("uw.edu");
  });
});

describe("safe redirects", () => {
  it("preserves internal paths with query strings", () => {
    expect(safeRedirectPath("/requests?view=sent")).toBe("/requests?view=sent");
  });

  it.each(["https://example.com", "//example.com", "\\example.com", "discover"])(
    "rejects unsafe destination %s",
    (destination) => {
      expect(safeRedirectPath(destination)).toBe("/discover");
    },
  );
});

describe("domain form validation", () => {
  it("accepts lightweight request intros without a scheduled time", () => {
    const result = requestSchema.safeParse({
      recipientId: "30000000-0000-4000-8000-000000000002",
      requestedSkillId: "20000000-0000-4000-8000-000000000001",
      message: "Hi",
      preferredAt: "",
      format: "online",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("Hi");
      expect(result.data.preferredAt).toBe("");
    }
  });

  it("accepts English numeric date-time text and normalizes it for requests", () => {
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const yyyy = future.getFullYear();
    const mm = String(future.getMonth() + 1).padStart(2, "0");
    const dd = String(future.getDate()).padStart(2, "0");
    const hh = String(future.getHours()).padStart(2, "0");
    const min = String(future.getMinutes()).padStart(2, "0");
    const result = requestSchema.safeParse({
      recipientId: "30000000-0000-4000-8000-000000000002",
      requestedSkillId: "20000000-0000-4000-8000-000000000001",
      message: "This message is long enough to explain the learning goal.",
      preferredAt: `${yyyy}/${mm}/${dd} ${hh}:${min}`,
      format: "online",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.preferredAt).toBe(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  });

  it("rejects a request with a past meeting time", () => {
    const result = requestSchema.safeParse({
      recipientId: "30000000-0000-4000-8000-000000000002",
      requestedSkillId: "20000000-0000-4000-8000-000000000001",
      message: "This message is long enough to explain the learning goal.",
      preferredAt: "2020-01-01T10:00:00.000Z",
      format: "online",
    });
    expect(result.success).toBe(false);
  });

  it("requires skills on both sides of a profile", () => {
    const result = profileSchema.safeParse({
      displayName: "Anita",
      major: "",
      biography: "",
      location: "",
      availability: "",
      meetingPreference: "either",
      beginnerFriendly: true,
      learningStyle: "",
      discoverable: true,
      showLocation: true,
      teachingSkillIds: [],
      learningSkillIds: [],
      customTeachingSkills: [],
      customLearningSkills: [],
    });
    expect(result.success).toBe(false);
  });

  it("allows minimal optional profile fields when custom skills are provided", () => {
    const result = profileSchema.safeParse({
      displayName: "Anita",
      major: "",
      biography: "",
      location: "",
      availability: "",
      meetingPreference: "either",
      beginnerFriendly: true,
      learningStyle: "",
      discoverable: true,
      showLocation: false,
      teachingSkillIds: [],
      learningSkillIds: [],
      customTeachingSkills: ["  Crochet   Basics  "],
      customLearningSkills: ["Grant writing"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customTeachingSkills).toEqual(["Crochet Basics"]);
      expect(result.data.customLearningSkills).toEqual(["Grant writing"]);
      expect(result.data.biography).toBe("");
    }
  });

  it("rejects unsafe custom skill names", () => {
    const result = profileSchema.safeParse({
      displayName: "Anita",
      major: "",
      biography: "",
      location: "",
      availability: "",
      meetingPreference: "either",
      beginnerFriendly: true,
      learningStyle: "",
      discoverable: true,
      showLocation: false,
      teachingSkillIds: [],
      learningSkillIds: [],
      customTeachingSkills: ["https://bad.example"],
      customLearningSkills: ["me@example.com"],
    });
    expect(result.success).toBe(false);
  });

  it("distinguishes unanswered feedback from an explicit No response", () => {
    const missing = feedbackSchema.safeParse({
      requestId: "30000000-0000-4000-8000-000000000001",
      helpful: null,
      comfortableAndRespected: "yes",
      learnTogetherAgain: "no",
    });
    const complete = feedbackSchema.safeParse({
      requestId: "30000000-0000-4000-8000-000000000001",
      helpful: "no",
      comfortableAndRespected: "yes",
      learnTogetherAgain: "no",
    });

    expect(missing.success).toBe(false);
    expect(complete.success).toBe(true);
    if (complete.success) expect(complete.data.helpful).toBe(false);
  });
});
