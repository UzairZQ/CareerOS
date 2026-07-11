import { z } from "zod";
import { applicationStatusSchema } from "@/lib/application-validation";

export const workAuthorizationSchema = z.enum([
  "unknown",
  "student_visa",
  "eu_citizen",
  "job_seeker",
  "work_permit",
  "other",
]);

export const skillConfidenceSchema = z.enum([
  "direct",
  "bridge",
  "basic",
  "learning",
  "missing",
]);

export const aiProviderSchema = z.enum(["gemini", "groq", "openrouter"]);

export const dayTypeSchema = z.enum(["full", "half"]);

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);

const stringListSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(20)
  .transform((items) => [...new Set(items)]);

const optionalDateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    "Use a valid date.",
  );

const optionalUrlSchema = z
  .string()
  .trim()
  .max(700, "Proof link is too long.")
  .nullable()
  .transform((value) => value || null)
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a valid http or https URL.");

export const profileSchema = z.object({
  current_city: optionalTrimmedString(120),
  full_name: optionalTrimmedString(120),
  languages: stringListSchema,
  profile_note: optionalTrimmedString(1000),
  target_roles: stringListSchema,
  user_id: z.string().uuid(),
  work_authorization: workAuthorizationSchema,
});

export const cvTextSchema = optionalTrimmedString(100_000);

export const learningSprintDaysSchema = z.union([z.literal(3), z.literal(7), z.literal(14)]);

export const learningSprintSchema = z.object({
  application_id: z.string().uuid(),
  duration_days: learningSprintDaysSchema,
  skill: z.string().trim().min(1).max(120),
  user_id: z.string().uuid(),
});

export const learningSprintTaskProofSchema = z.object({
  proof_note: optionalTrimmedString(1200),
  proof_url: optionalUrlSchema,
});

export const workHourLogSchema = z.object({
  day_type: dayTypeSchema,
  employer: optionalTrimmedString(160),
  hours: z.coerce
    .number({ error: "Hours must be a number." })
    .positive("Hours must be greater than zero.")
    .max(24, "Hours cannot exceed 24 in one entry.")
    .refine((value) => Number.isFinite(value), "Hours must be a valid number."),
  notes: optionalTrimmedString(500),
  user_id: z.string().uuid(),
  work_date: optionalDateSchema,
});

export const evidenceItemSchema = z
  .object({
    application_id: z.string().uuid(),
    confidence: skillConfidenceSchema,
    evidence_summary: optionalTrimmedString(4000),
    evidence_type: z.enum([
      "project",
      "work_experience",
      "course",
      "certification",
      "learning_task",
      "other",
    ]),
    proof_task: z.string().trim().min(1).max(500),
    proof_url: optionalUrlSchema,
    requirement: z.enum(["required", "nice-to-have"]),
    skill: z.string().trim().min(1).max(120),
    skill_category: z.enum(["frontend", "backend", "data", "tools", "language", "process"]),
    user_id: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (
      ["direct", "bridge", "basic"].includes(value.confidence) &&
      !value.proof_url
    ) {
      context.addIssue({
        code: "custom",
        message: "Add a proof link before marking this skill CV-ready.",
        path: ["proof_url"],
      });
    }
  });

export const aiSettingsSchema = z.object({
  apiKey: z.string().trim().min(8, "Paste a valid API key before saving.").max(3000),
  provider: aiProviderSchema,
});

export const aiSettingsDeleteSchema = z.object({
  provider: aiProviderSchema,
});

export const aiInsightRequestSchema = z.object({
  input: z.record(z.string(), z.unknown()).default({}),
  kind: z.enum(["skill-gap", "ats-check", "application-angle"]),
  provider: aiProviderSchema,
});

export { applicationStatusSchema };

export function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatValidationError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
