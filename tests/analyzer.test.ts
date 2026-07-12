import { describe, expect, it } from "vitest";
import {
  analyzeCvText,
  analyzeJobDescription,
  createLearningSprint,
  generateApplicationAssistantSuggestions,
  hasSprintTaskProof,
} from "@/lib/careeros-analyzer";

describe("job description analyzer", () => {
  it("extracts required skills, nice-to-have skills, language, location, and work mode", () => {
    const analysis = analyzeJobDescription(`
      Frontend Working Student - Berlin Hybrid
      Requirements: experience with React, TypeScript, REST APIs and Git is required.
      German B1 preferred. Nice to have: Tailwind CSS and Supabase.
      Responsibilities:
      - Build responsive UI components with designers and backend engineers
    `);

    expect(analysis.roleType).toBe("Working student");
    expect(analysis.workMode).toBe("Hybrid");
    expect(analysis.locationSignals).toContain("Berlin");
    expect(analysis.languageRequirements).toContain("German B1");
    expect(analysis.requiredSkills.map((skill) => skill.skill)).toEqual(
      expect.arrayContaining(["React", "TypeScript", "REST APIs", "Git"]),
    );
    expect(analysis.niceToHaveSkills.map((skill) => skill.skill)).toEqual(
      expect.arrayContaining(["Tailwind CSS", "Supabase"]),
    );
  });

  it("generates sprint tasks for weak skills", () => {
    const sprint = createLearningSprint("PostgreSQL", 7);

    expect(sprint).toHaveLength(7);
    expect(sprint.join(" ")).toContain("PostgreSQL");
  });

  it("accepts either a proof link or a proof note for a sprint task", () => {
    expect(hasSprintTaskProof({ proof_url: "", proof_note: "Explained the implementation." })).toBe(true);
    expect(hasSprintTaskProof({ proof_url: "https://github.com/example/proof", proof_note: "" })).toBe(true);
    expect(hasSprintTaskProof({ proof_url: "", proof_note: "" })).toBe(false);
  });

  it("does not confuse generic next text or SQL with specific skills", () => {
    const analysis = analyzeJobDescription(
      "Your next step is to work with SQL queries. Git is a plus.",
    );

    const detectedSkills = [
      ...analysis.requiredSkills,
      ...analysis.niceToHaveSkills,
    ].map((skill) => skill.skill);

    expect(detectedSkills).toEqual(expect.arrayContaining(["SQL", "Git"]));
    expect(detectedSkills).not.toContain("Next.js");
    expect(detectedSkills).not.toContain("PostgreSQL");
  });
});

describe("CV check and assistant", () => {
  it("flags missing JD keywords and broad unsupported claims", () => {
    const check = analyzeCvText(
      "Skills: React, HTML, CSS. Experience: built a frontend project. Expert in everything.",
      "Required: React, TypeScript, PostgreSQL, Git.",
    );

    expect(check.missingKeywords).toEqual(expect.arrayContaining(["TypeScript", "PostgreSQL"]));
    expect(check.riskyClaims.length).toBeGreaterThan(0);
    expect(check.score).toBeLessThan(100);
  });

  it("keeps assistant suggestions evidence-backed", () => {
    const suggestions = generateApplicationAssistantSuggestions({
      company: "CareerOS Test GmbH",
      evidence: [
        {
          confidence: "direct",
          evidence_summary: "Built a Next.js dashboard with Supabase Auth.",
          proof_url: "https://github.com/example/careeros",
          skill: "Next.js",
        },
        {
          confidence: "missing",
          evidence_summary: null,
          proof_url: null,
          skill: "PostgreSQL",
        },
      ],
      jobDescription: "Required: Next.js, Supabase, PostgreSQL.",
      role: "Frontend Working Student",
    });

    expect(suggestions.evidenceBackedSkills).toContain("Next.js");
    expect(suggestions.evidenceBackedSkills).not.toContain("PostgreSQL");
    expect(suggestions.proofWarnings.join(" ")).toContain("PostgreSQL");
  });
});
