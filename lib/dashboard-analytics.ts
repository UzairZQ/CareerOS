import { analyzeJobDescription } from "@/lib/careeros-analyzer";

export type DashboardApplicationAnalyticsInput = {
  id: string;
  company: string;
  role: string;
  status: "saved" | "applied" | "interview" | "rejected" | "offer";
  follow_up_date: string | null;
  job_description: string | null;
};

export type DashboardEvidenceAnalyticsInput = {
  application_id: string | null;
  skill: string;
  confidence: "direct" | "bridge" | "basic" | "learning" | "missing";
  evidence_summary: string | null;
  proof_url: string | null;
};

export type DashboardAnalytics = {
  totalApplications: number;
  activeApplications: number;
  responseRate: number;
  nextFollowUpLabel: string;
  nextFollowUpCompany: string;
  cvReadyEvidenceCount: number;
  evidenceCoverage: number;
  mostRequestedSkills: Array<{ skill: string; count: number }>;
  mostMissingSkills: Array<{ skill: string; count: number }>;
  bestFitRoleCategories: Array<{ role: string; count: number }>;
  skillGapGrade: string;
};

export function calculateDashboardAnalytics({
  applications,
  evidence,
  today = new Date(),
}: {
  applications: DashboardApplicationAnalyticsInput[];
  evidence: DashboardEvidenceAnalyticsInput[];
  today?: Date;
}): DashboardAnalytics {
  const analyzedApplications = applications
    .filter((application) => application.job_description?.trim())
    .map((application) => ({
      application,
      analysis: analyzeJobDescription(application.job_description ?? ""),
    }));
  const requestedSkills = analyzedApplications.flatMap(({ analysis }) => [
    ...analysis.requiredSkills.map((skill) => skill.skill),
    ...analysis.niceToHaveSkills.map((skill) => skill.skill),
  ]);
  const cvReadyEvidence = evidence.filter(
    (item) =>
      item.evidence_summary?.trim() &&
      item.proof_url?.trim() &&
      item.confidence !== "missing" &&
      item.confidence !== "learning",
  );
  const requestedSkillSet = new Set(unique(requestedSkills));
  const evidencedSkills = new Set(
    cvReadyEvidence
      .map((item) => item.skill)
      .filter((skill) => requestedSkillSet.has(skill)),
  );
  const missingSkills = requestedSkills.filter((skill) => !evidencedSkills.has(skill));
  const respondedApplications = applications.filter((application) =>
    ["interview", "offer", "rejected"].includes(application.status),
  );
  const submittedApplications = applications.filter((application) => application.status !== "saved");
  const evidenceCoverage =
    requestedSkillSet.size > 0 ? Math.round((evidencedSkills.size / requestedSkillSet.size) * 100) : 0;

  return {
    totalApplications: applications.length,
    activeApplications: applications.filter((application) =>
      ["saved", "applied", "interview"].includes(application.status),
    ).length,
    responseRate:
      submittedApplications.length > 0
        ? Math.round((respondedApplications.length / submittedApplications.length) * 100)
        : 0,
    nextFollowUpLabel: getNextFollowUp(applications, today).label,
    nextFollowUpCompany: getNextFollowUp(applications, today).company,
    cvReadyEvidenceCount: cvReadyEvidence.length,
    evidenceCoverage,
    mostRequestedSkills: topCounts(requestedSkills, 6),
    mostMissingSkills: topCounts(missingSkills, 6),
    bestFitRoleCategories: topCounts(
      analyzedApplications.map(({ analysis }) => analysis.roleType),
      4,
    ).map((item) => ({ role: item.skill, count: item.count })),
    skillGapGrade: gradeEvidenceCoverage(evidenceCoverage),
  };
}

function getNextFollowUp(applications: DashboardApplicationAnalyticsInput[], today: Date) {
  const todayIso = today.toISOString().slice(0, 10);
  const next = applications
    .filter((application) => application.follow_up_date && application.follow_up_date >= todayIso)
    .sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)))[0];

  if (!next?.follow_up_date) {
    return { label: "None set", company: "Add follow-up dates" };
  }

  const days = daysBetween(todayIso, next.follow_up_date);
  return {
    label: days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`,
    company: next.company,
  };
}

function daysBetween(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T00:00:00.000Z`).getTime();
  const end = new Date(`${endIso}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function topCounts(values: string[], limit: number) {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    if (!value) return accumulator;
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function gradeEvidenceCoverage(coverage: number) {
  if (coverage >= 85) return "A";
  if (coverage >= 70) return "B+";
  if (coverage >= 55) return "B";
  if (coverage >= 40) return "C";
  return "D";
}
