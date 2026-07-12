import type { CvCheck } from "@/lib/analyzer-types";
import { countMatches, unique } from "@/lib/analyzer-utils";
import { analyzeJobDescription } from "@/lib/job-analyzer";

export function analyzeCvText(cvText: string, jobDescription: string): CvCheck {
  const normalizedCv = cvText.trim();
  const cv = normalizedCv.toLowerCase();
  const jdAnalysis = analyzeJobDescription(jobDescription);
  const requestedSkills = [...jdAnalysis.requiredSkills, ...jdAnalysis.niceToHaveSkills];
  const keywordMatches = requestedSkills
    .filter((skill) => countMatches(cv, [skill.skill.toLowerCase()]) > 0)
    .map((skill) => skill.skill);
  const missingKeywords = requestedSkills
    .filter((skill) => !keywordMatches.includes(skill.skill))
    .map((skill) => skill.skill)
    .slice(0, 10);

  const sections = [
    {
      label: "Contact info parsed",
      passed: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(normalizedCv),
      detail: "Email address should be plain text, not only inside an image or header graphic.",
    },
    {
      label: "Standard sections",
      passed: hasAny(cv, ["experience", "work experience", "projects", "education", "skills"]),
      detail: "ATS systems prefer predictable headings like Experience, Projects, Education, Skills.",
    },
    {
      label: "Readable length",
      passed: wordCount(normalizedCv) >= 120 && wordCount(normalizedCv) <= 950,
      detail: "For early-career roles, keep the CV dense but not bloated.",
    },
    {
      label: "Bullet evidence",
      passed: extractCvBullets(normalizedCv).some((bullet) => hasProofSignal(bullet)),
      detail: "At least some bullets should show proof: shipped, built, measured, deployed, tested, or linked.",
    },
    {
      label: "JD keyword coverage",
      passed: requestedSkills.length === 0 ? false : keywordMatches.length / requestedSkills.length >= 0.45,
      detail: "Use exact skill wording when it is true and evidence-backed.",
    },
  ];

  const riskyClaims = findRiskyClaims(normalizedCv);
  const bulletIssues = extractCvBullets(normalizedCv)
    .filter((bullet) => bullet.length > 160 || !hasProofSignal(bullet))
    .slice(0, 5)
    .map((bullet) =>
      bullet.length > 160
        ? `Long bullet: ${bullet.slice(0, 110)}...`
        : `Needs proof: ${bullet.slice(0, 130)}`,
    );
  const suggestions = buildCvSuggestions(sections, missingKeywords, riskyClaims, bulletIssues);
  const score = calculateCvScore(sections, keywordMatches.length, requestedSkills.length, riskyClaims.length);

  return {
    score,
    sections,
    keywordMatches,
    missingKeywords,
    riskyClaims,
    bulletIssues,
    suggestions,
  };
}

function hasAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractCvBullets(text: string) {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 40);
}

function hasProofSignal(text: string) {
  return /built|shipped|implemented|deployed|tested|improved|reduced|increased|designed|led|created|github|repo|certificate|measured|automated|\d+%|\d+x|\d+\s*(users|hours|screens|components|apis|tests)/i.test(
    text,
  );
}

function findRiskyClaims(text: string) {
  const riskyPatterns = [
    /\bexpert\b/gi,
    /\bmastered\b/gi,
    /\badvanced\b/gi,
    /\bfluent\b/gi,
    /\bproduction[- ]ready\b/gi,
    /\bfull[- ]stack\b/gi,
  ];

  return unique(
    riskyPatterns.flatMap((pattern) =>
      [...text.matchAll(pattern)].map((match) => `Check evidence for claim: "${match[0]}"`),
    ),
  ).slice(0, 8);
}

function buildCvSuggestions(
  sections: CvCheck["sections"],
  missingKeywords: string[],
  riskyClaims: string[],
  bulletIssues: string[],
) {
  const suggestions: string[] = [];
  sections
    .filter((section) => !section.passed)
    .forEach((section) => suggestions.push(section.detail));

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Missing JD keywords that may matter: ${missingKeywords.slice(0, 6).join(", ")}. Add only if you have proof.`,
    );
  }

  if (riskyClaims.length > 0) suggestions.push("Downgrade or prove broad claims before they appear in your CV.");
  if (bulletIssues.length > 0) suggestions.push("Rewrite weak bullets into evidence-backed outcomes: action, scope, proof, result.");

  return suggestions.slice(0, 7);
}

function calculateCvScore(
  sections: CvCheck["sections"],
  keywordMatches: number,
  requestedSkills: number,
  riskyClaimCount: number,
) {
  const sectionScore = sections.filter((section) => section.passed).length * 12;
  const keywordScore = requestedSkills > 0 ? Math.min(30, (keywordMatches / requestedSkills) * 30) : 0;
  const riskPenalty = Math.min(18, riskyClaimCount * 4);
  return Math.max(0, Math.min(100, Math.round(sectionScore + keywordScore + 10 - riskPenalty)));
}
