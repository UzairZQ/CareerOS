import { describe, expect, it } from "vitest";
import { calculateDashboardAnalytics } from "@/lib/dashboard-analytics";

describe("dashboard analytics", () => {
  it("counts response rate and requested skills from all applications", () => {
    const analytics = calculateDashboardAnalytics({
      applications: [
        {
          company: "Saved GmbH",
          follow_up_date: null,
          id: "saved",
          job_description: "Required: React.",
          role: "Frontend Developer",
          status: "saved",
        },
        {
          company: "Applied GmbH",
          follow_up_date: null,
          id: "applied",
          job_description: "Required: React.",
          role: "Frontend Developer",
          status: "applied",
        },
        {
          company: "Interview GmbH",
          follow_up_date: "2026-07-14",
          id: "interview",
          job_description: "Required: React.",
          role: "Frontend Developer",
          status: "interview",
        },
      ],
      evidence: [],
      today: new Date("2026-07-10T12:00:00.000Z"),
    });

    expect(analytics.totalApplications).toBe(3);
    expect(analytics.activeApplications).toBe(3);
    expect(analytics.responseRate).toBe(50);
    expect(analytics.mostRequestedSkills).toEqual([{ skill: "React", count: 3 }]);
    expect(analytics.nextFollowUpLabel).toBe("4 days");
    expect(analytics.nextFollowUpCompany).toBe("Interview GmbH");
  });

  it("does not count evidence without a proof link as CV-ready", () => {
    const baseInput = {
      application_id: "application",
      confidence: "direct" as const,
      evidence_summary: "Built a React interface.",
      skill: "React",
    };

    const withoutProof = calculateDashboardAnalytics({
      applications: [
        {
          company: "Proof GmbH",
          follow_up_date: null,
          id: "application",
          job_description: "Required: React.",
          role: "Frontend Developer",
          status: "applied",
        },
      ],
      evidence: [{ ...baseInput, proof_url: null }],
    });
    const withProof = calculateDashboardAnalytics({
      applications: [
        {
          company: "Proof GmbH",
          follow_up_date: null,
          id: "application",
          job_description: "Required: React.",
          role: "Frontend Developer",
          status: "applied",
        },
      ],
      evidence: [{ ...baseInput, proof_url: "https://github.com/example/repo" }],
    });

    expect(withoutProof.cvReadyEvidenceCount).toBe(0);
    expect(withoutProof.evidenceCoverage).toBe(0);
    expect(withProof.cvReadyEvidenceCount).toBe(1);
    expect(withProof.evidenceCoverage).toBe(100);
  });
});
