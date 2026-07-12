export type SkillConfidence = "direct" | "bridge" | "basic" | "learning" | "missing";

export type SkillMatch = {
  skill: string;
  category: "frontend" | "backend" | "data" | "tools" | "language" | "process";
  requirement: "required" | "nice-to-have";
  hits: number;
};

export type JobAnalysis = {
  requiredSkills: SkillMatch[];
  niceToHaveSkills: SkillMatch[];
  languageRequirements: string[];
  locationSignals: string[];
  workMode: string;
  roleType: string;
  responsibilities: string[];
  fitSummary: string;
};

export type CvCheck = {
  score: number;
  sections: Array<{ label: string; passed: boolean; detail: string }>;
  keywordMatches: string[];
  missingKeywords: string[];
  riskyClaims: string[];
  bulletIssues: string[];
  suggestions: string[];
};

export type AssistantEvidenceInput = {
  skill: string;
  evidence_summary: string | null;
  confidence: SkillConfidence;
  proof_url: string | null;
};

export type ApplicationAssistantSuggestions = {
  subtitle: string;
  profileAngle: string;
  bulletAngles: string[];
  coverLetterUsp: string;
  proofWarnings: string[];
  evidenceBackedSkills: string[];
};
