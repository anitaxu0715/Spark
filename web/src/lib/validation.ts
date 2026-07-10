import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);

export function extractEmailDomain(email: string) {
  const parsed = emailSchema.safeParse(email);
  return parsed.success ? parsed.data.toLowerCase().split("@")[1] : null;
}

export const passwordSchema = z.string()
  .min(10, "Use at least 10 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.")
  .regex(/[^A-Za-z0-9]/, "Include a symbol.");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  inviteCode: z.string().trim().max(120, "Invite codes must be 120 characters or fewer.").optional(),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

const optionalText = (max: number, message: string) =>
  z.preprocess((value) => (typeof value === "string" ? value.trim() : ""), z.string().max(max, message));

function normalizeLocalDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const candidate = new Date(year, month - 1, day, hour, minute);
  if (
    candidate.getFullYear() !== year
    || candidate.getMonth() !== month - 1
    || candidate.getDate() !== day
    || candidate.getHours() !== hour
    || candidate.getMinutes() !== minute
  ) {
    return null;
  }
  return `${yearText.padStart(4, "0")}-${monthText.padStart(2, "0")}-${dayText.padStart(2, "0")}T${hourText.padStart(2, "0")}:${minuteText.padStart(2, "0")}`;
}

const localDateTimeSchema = z.string()
  .trim()
  .transform((value, context) => {
    const normalized = normalizeLocalDateTime(value);
    if (!normalized) {
      context.addIssue({ code: "custom", message: "Use YYYY-MM-DD HH:MM or YYYY/MM/DD HH:MM." });
      return z.NEVER;
    }
    return normalized;
  })
  .refine((value) => new Date(value) > new Date(), "Choose a future date and time.");

const optionalLocalDateTimeSchema = z.string()
  .trim()
  .transform((value, context) => {
    const normalized = normalizeLocalDateTime(value);
    if (normalized === null) {
      context.addIssue({ code: "custom", message: "Use YYYY-MM-DD HH:MM or YYYY/MM/DD HH:MM, or leave this blank." });
      return z.NEVER;
    }
    return normalized;
  });

const customSkillNames = z.array(z.string())
  .transform((values) => values.map((value) => value.trim().replace(/\s+/g, " ")).filter(Boolean))
  .superRefine((values, context) => {
    values.forEach((value, index) => {
      if (value.length < 2 || value.length > 80) {
        context.addIssue({
          code: "custom",
          message: "Custom skills must be 2-80 characters.",
          path: [index],
        });
      }
      if (!/[A-Za-z0-9]/.test(value) || /(^|\s)https?:\/\//i.test(value) || /(^|\s)www\./i.test(value) || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) || /[<>]/.test(value)) {
        context.addIssue({
          code: "custom",
          message: "Custom skills cannot contain URLs, emails, or markup.",
          path: [index],
        });
      }
    });
  });

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your display name.").max(80),
  major: optionalText(120, "Keep your major or area of study under 120 characters."),
  biography: optionalText(800, "Keep your biography under 800 characters."),
  location: optionalText(120, "Keep your general location under 120 characters."),
  availability: optionalText(240, "Keep your availability under 240 characters."),
  meetingPreference: z.enum(["online", "in-person", "either"]),
  beginnerFriendly: z.boolean(),
  learningStyle: optionalText(240, "Keep your teaching and learning style under 240 characters."),
  discoverable: z.boolean(),
  showLocation: z.boolean(),
  teachingSkillIds: z.array(z.string().uuid()),
  learningSkillIds: z.array(z.string().uuid()),
  customTeachingSkills: customSkillNames,
  customLearningSkills: customSkillNames,
}).superRefine((values, context) => {
  if (values.teachingSkillIds.length + values.customTeachingSkills.length < 1) {
    context.addIssue({
      code: "custom",
      path: ["teachingSkillIds"],
      message: "Choose or add at least one skill you can share.",
    });
  }
  if (values.learningSkillIds.length + values.customLearningSkills.length < 1) {
    context.addIssue({
      code: "custom",
      path: ["learningSkillIds"],
      message: "Choose or add at least one skill you want to learn.",
    });
  }
});

export const requestSchema = z.object({
  recipientId: z.string().uuid(),
  requestedSkillId: z.string().uuid("Choose a skill."),
  message: z.string().trim().max(1000),
  preferredAt: optionalLocalDateTimeSchema.refine((value) => !value || new Date(value) > new Date(), "Choose a future date and time."),
  format: z.enum(["online", "in-person"]),
  offeredSkillId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

export const feedbackSchema = z.object({
  requestId: z.string().uuid(),
  helpful: z.enum(["yes", "no"], { error: "Choose Yes or No." }).transform((value) => value === "yes"),
  comfortableAndRespected: z.enum(["yes", "no"], { error: "Choose Yes or No." }).transform((value) => value === "yes"),
  learnTogetherAgain: z.enum(["yes", "no"], { error: "Choose Yes or No." }).transform((value) => value === "yes"),
  privateNote: z.string().trim().max(1000).optional(),
});

export const profileIdSchema = z.string().uuid("This profile is not available.");

export const requestTransitionSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["accepted", "declined", "completed", "cancelled"]),
  cancellationReason: z.string().trim().max(300).optional(),
});

export const requestMessageSchema = z.object({
  requestId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a short message before sending.").max(1000, "Keep messages under 1,000 characters."),
});

export const reportSchema = z.object({
  profileId: z.string().uuid(),
  reason: z.enum(["safety", "harassment", "spam", "misrepresentation", "other"]),
  details: z.string().trim().max(1000, "Keep private details under 1,000 characters.").optional(),
});

export const rescheduleSchema = z.object({
  requestId: z.string().uuid(),
  preferredAt: localDateTimeSchema,
  format: z.enum(["online", "in-person"]),
  note: z.string().trim().max(500).optional(),
});

export const moderationCaseSchema = z.object({
  caseId: z.string().uuid(),
  status: z.enum(["submitted", "reviewing", "resolved", "dismissed", "escalated"]),
  priority: z.enum(["standard", "elevated", "urgent"]),
  reason: z.string().trim().max(1000).optional(),
});

export const restrictionSchema = z.object({
  caseId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["temporary_suspension", "indefinite_suspension"]),
  reason: z.string().trim().min(10).max(1000),
  expiresAt: optionalLocalDateTimeSchema.optional(),
});

export const domainSchema = z.object({
  universityId: z.string().uuid(),
  domain: z.string().trim().toLowerCase().min(3).max(253).regex(/^[a-z0-9.-]+\.[a-z]{2,}$|^[a-z0-9.-]+\.test$/),
  development: z.boolean(),
});

export function safeRedirectPath(value: string | null | undefined, fallback = "/discover") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, "http://spark.local");
    return parsed.origin === "http://spark.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export type ActionState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
