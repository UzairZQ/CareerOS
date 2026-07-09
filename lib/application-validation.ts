import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "saved",
  "applied",
  "interview",
  "rejected",
  "offer",
]);

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .max(700, "URL is too long.")
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

const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  }, "Use a valid date.");

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required.").max(120),
  follow_up_date: optionalDate,
  job_description: optionalTrimmedString(12000),
  location: optionalTrimmedString(160),
  notes: optionalTrimmedString(4000),
  role: z.string().trim().min(1, "Role is required.").max(160),
  status: applicationStatusSchema,
  url: optionalUrl,
});

export const updateApplicationSchema = z.object({
  follow_up_date: optionalDate,
  notes: optionalTrimmedString(4000),
  status: applicationStatusSchema,
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
