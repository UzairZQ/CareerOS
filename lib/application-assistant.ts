import type {
  ApplicationAssistantSuggestions,
  AssistantEvidenceInput,
} from "@/lib/analyzer-types";
import { analyzeJobDescription } from "@/lib/job-analyzer";

export function generateApplicationAssistantSuggestions({
  company,
  evidence,
  jobDescription,
  role,
}: {
  company: string;
  evidence: AssistantEvidenceInput[];
  jobDescription: string;
  role: string;
}): ApplicationAssistantSuggestions {
  const analysis = analyzeJobDescription(jobDescription);
  const requiredSkillNames = analysis.requiredSkills.map((skill) => skill.skill);
  const evidenceBacked = evidence.filter(
    (item) =>
      item.evidence_summary?.trim() &&
      item.confidence !== "missing" &&
      item.confidence !== "learning",
  );
  const directEvidence = evidenceBacked.filter((item) => item.confidence === "direct");
  const bridgeEvidence = evidenceBacked.filter((item) => item.confidence === "bridge");
  const evidenceBackedSkills = evidenceBacked.map((item) => item.skill);
  const strongestSkills = [
    ...directEvidence.map((item) => item.skill),
    ...bridgeEvidence.map((item) => item.skill),
    ...evidenceBackedSkills,
  ].filter((skill, index, list) => list.indexOf(skill) === index);
  const missingRequired = requiredSkillNames.filter((skill) => !evidenceBackedSkills.includes(skill));
  const topSkillPhrase = strongestSkills.slice(0, 3).join(", ") || "documented project evidence";
  const roleLabel = role || analysis.roleType;
  const companyLabel = company || "this employer";

  return {
    subtitle: strongestSkills.length
      ? `${roleLabel} candidate with proof in ${topSkillPhrase}`
      : `${roleLabel} candidate building proof against the JD requirements`,
    profileAngle: strongestSkills.length
      ? `Position yourself as a proof-first ${analysis.roleType.toLowerCase()} applicant: lead with ${topSkillPhrase}, then show the exact project or task evidence behind each claim.`
      : `Position yourself carefully: the JD is understandable, but the evidence map does not yet support strong CV claims. Build proof before tailoring aggressively.`,
    bulletAngles: buildBulletAngles(evidenceBacked, analysis.responsibilities, roleLabel),
    coverLetterUsp: strongestSkills.length
      ? `For ${companyLabel}, your strongest angle is not “I am passionate”; it is that your ${topSkillPhrase} claims can be traced to concrete proof. Use one sentence to connect that proof to ${analysis.responsibilities[0] || "the role responsibilities"}.`
      : `For ${companyLabel}, keep the cover letter modest: explain the learning direction, name the missing proof tasks, and avoid claiming skills that are still unverified.`,
    proofWarnings: missingRequired
      .slice(0, 6)
      .map((skill) => `Do not make ${skill} CV-ready until an evidence item or proof link exists.`),
    evidenceBackedSkills,
  };
}

function buildBulletAngles(
  evidence: AssistantEvidenceInput[],
  responsibilities: string[],
  roleLabel: string,
) {
  if (evidence.length === 0) {
    return [
      `Build one proof project for ${roleLabel}, then write the bullet as: action + skill + proof link + outcome.`,
      "Avoid generic claims like “good knowledge” until the Evidence Map has a direct or bridge entry.",
    ];
  }

  return evidence.slice(0, 4).map((item, index) => {
    const responsibility = responsibilities[index] || "a relevant responsibility from the JD";
    return `Use ${item.skill} as a bullet angle only with proof: ${item.evidence_summary}. Tie it to “${responsibility}”.`;
  });
}
