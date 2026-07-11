import { describe, expect, it } from "vitest";
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationRecordSchema,
} from "@/lib/application-validation";
import {
  aiInsightRequestSchema,
  aiSettingsSchema,
  evidenceItemSchema,
  learningSprintSchema,
  learningSprintTaskProofSchema,
  parseCommaList,
  profileSchema,
  workHourLogSchema,
} from "@/lib/dashboard-validation";
import { getSafeNext } from "@/lib/auth-navigation";
import { formatAuthError } from "@/lib/auth-errors";

const userId = "11111111-1111-4111-8111-111111111111";
const applicationId = "22222222-2222-4222-8222-222222222222";

describe("application validation", () => {
  it("trims and normalizes optional fields on create", () => {
    const parsed = createApplicationSchema.parse({
      company: "  SAP  ",
      follow_up_date: "",
      job_description: "  React and TypeScript role  ",
      location: " Berlin ",
      notes: "",
      role: " Working Student ",
      status: "saved",
      url: "",
    });

    expect(parsed).toMatchObject({
      company: "SAP",
      follow_up_date: null,
      job_description: "React and TypeScript role",
      location: "Berlin",
      notes: null,
      role: "Working Student",
      url: null,
    });
  });

  it("rejects empty required fields, invalid status, and unsafe URLs", () => {
    expect(
      createApplicationSchema.safeParse({
        company: "",
        follow_up_date: "2026-07-15",
        job_description: "",
        location: "",
        notes: "",
        role: "Developer",
        status: "ghost",
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("validates update payloads without requiring unchanged fields", () => {
    expect(
      updateApplicationSchema.parse({
        follow_up_date: "2026-07-15",
        notes: "Follow up after portfolio review.",
        status: "interview",
      }),
    ).toEqual({
      follow_up_date: "2026-07-15",
      notes: "Follow up after portfolio review.",
      status: "interview",
    });
  });

  it("validates the complete editable application record", () => {
    const parsed = updateApplicationRecordSchema.parse({
      company: "  SAP  ",
      job_description: "  Build React dashboards.  ",
      location: " Berlin ",
      role: " Frontend Developer ",
      url: " https://jobs.example.com/frontend ",
    });

    expect(parsed).toEqual({
      company: "SAP",
      job_description: "Build React dashboards.",
      location: "Berlin",
      role: "Frontend Developer",
      url: "https://jobs.example.com/frontend",
    });
    expect(
      updateApplicationRecordSchema.safeParse({
        company: "SAP",
        job_description: "",
        location: "Berlin",
        role: "Frontend Developer",
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});

describe("auth navigation", () => {
  it("allows only same-origin relative callback destinations", () => {
    expect(getSafeNext("/dashboard?from=google")).toBe("/dashboard?from=google");
    expect(getSafeNext("https://example.com")).toBe("/dashboard");
    expect(getSafeNext("//example.com")).toBe("/dashboard");
    expect(getSafeNext("/\\\\example.com")).toBe("/dashboard");
    expect(getSafeNext(null)).toBe("/dashboard");
  });

  it("turns common provider auth failures into useful messages", () => {
    expect(formatAuthError("over_email_send_rate_limit")).toContain("confirmation emails");
    expect(formatAuthError("email_address_invalid")).toBe("Enter a valid email address.");
    expect(formatAuthError("Invalid login credentials")).toBe("Email or password is incorrect.");
    expect(formatAuthError("Unexpected provider error")).toBe("Unexpected provider error");
  });
});

describe("dashboard validation", () => {
  it("normalizes profile lists and rejects invalid user ids", () => {
    expect(parseCommaList("English C1, German B1, English C1")).toEqual([
      "English C1",
      "German B1",
      "English C1",
    ]);

    const parsed = profileSchema.parse({
      current_city: " Frankfurt ",
      full_name: " Codex Test ",
      languages: ["English C1", "German B1", "English C1"],
      profile_note: "",
      target_roles: ["Frontend Working Student"],
      user_id: userId,
      work_authorization: "student_visa",
    });

    expect(parsed.languages).toEqual(["English C1", "German B1"]);
    expect(parsed.profile_note).toBeNull();
    expect(profileSchema.safeParse({ ...parsed, user_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects impossible work-hour logs", () => {
    expect(
      workHourLogSchema.safeParse({
        day_type: "half",
        employer: "Mini job",
        hours: "4.5",
        notes: "",
        user_id: userId,
        work_date: "2026-07-09",
      }).success,
    ).toBe(true);

    expect(
      workHourLogSchema.safeParse({
        day_type: "half",
        employer: "Mini job",
        hours: "25",
        notes: "",
        user_id: userId,
        work_date: "2026-07-09",
      }).success,
    ).toBe(false);
  });

  it("validates sprint setup and normalizes proof fields", () => {
    expect(
      learningSprintSchema.safeParse({
        application_id: applicationId,
        duration_days: 7,
        skill: "TypeScript",
        user_id: userId,
      }).success,
    ).toBe(true);
    expect(
      learningSprintTaskProofSchema.parse({
        proof_note: "Explained the type narrowing decision.",
        proof_url: "",
      }),
    ).toEqual({
      proof_note: "Explained the type narrowing decision.",
      proof_url: null,
    });
    expect(learningSprintTaskProofSchema.parse({ proof_note: "", proof_url: "" })).toEqual({
      proof_note: null,
      proof_url: null,
    });
  });

  it("requires evidence proof links to be safe URLs when present", () => {
    const baseEvidence = {
      application_id: applicationId,
      confidence: "direct",
      evidence_summary: "Built a deployed React project.",
      evidence_type: "project",
      proof_task: "Attach repository link.",
      proof_url: "https://github.com/example/repo",
      requirement: "required",
      skill: "React",
      skill_category: "frontend",
      user_id: userId,
    };

    expect(evidenceItemSchema.safeParse(baseEvidence).success).toBe(true);
    expect(
      evidenceItemSchema.safeParse({
        ...baseEvidence,
        proof_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);

    expect(
      evidenceItemSchema.safeParse({
        ...baseEvidence,
        proof_url: null,
      }).success,
    ).toBe(false);

    expect(
      evidenceItemSchema.safeParse({
        ...baseEvidence,
        confidence: "missing",
        evidence_summary: null,
        proof_url: null,
      }).success,
    ).toBe(true);
  });

  it("validates BYOK AI settings", () => {
    expect(aiSettingsSchema.safeParse({ apiKey: "12345678", provider: "gemini" }).success).toBe(
      true,
    );
    expect(aiSettingsSchema.safeParse({ apiKey: "short", provider: "claude" }).success).toBe(
      false,
    );
  });

  it("rejects malformed AI insight request bodies", () => {
    expect(
      aiInsightRequestSchema.safeParse({
        input: { missing: ["proof"] },
        kind: "skill-gap",
        provider: "gemini",
      }).success,
    ).toBe(true);
    expect(aiInsightRequestSchema.safeParse(null).success).toBe(false);
    expect(
      aiInsightRequestSchema.safeParse({ input: [], kind: "skill-gap", provider: "gemini" }).success,
    ).toBe(false);
    expect(
      aiInsightRequestSchema.safeParse({ input: {}, kind: "unknown", provider: "gemini" }).success,
    ).toBe(false);
  });
});
