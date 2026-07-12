import type { JobAnalysis, SkillMatch } from "@/lib/analyzer-types";
import { countMatches, unique } from "@/lib/analyzer-utils";

const skillDictionary: Array<Omit<SkillMatch, "requirement" | "hits"> & { aliases: string[] }> = [
  { skill: "HTML", category: "frontend", aliases: ["html", "semantic html"] },
  { skill: "CSS", category: "frontend", aliases: ["css", "scss", "sass", "responsive design"] },
  { skill: "JavaScript", category: "frontend", aliases: ["javascript", "js", "ecmascript"] },
  { skill: "TypeScript", category: "frontend", aliases: ["typescript", "ts"] },
  { skill: "React", category: "frontend", aliases: ["react", "react.js", "reactjs"] },
  { skill: "Next.js", category: "frontend", aliases: ["next.js", "nextjs"] },
  { skill: "Tailwind CSS", category: "frontend", aliases: ["tailwind", "tailwind css"] },
  { skill: "Accessibility", category: "frontend", aliases: ["accessibility", "a11y", "wcag"] },
  { skill: "Node.js", category: "backend", aliases: ["node.js", "nodejs", "node"] },
  { skill: "REST APIs", category: "backend", aliases: ["rest", "rest api", "restful"] },
  { skill: "PostgreSQL", category: "backend", aliases: ["postgresql", "postgres"] },
  { skill: "Supabase", category: "backend", aliases: ["supabase"] },
  { skill: "Authentication", category: "backend", aliases: ["authentication", "auth", "oauth", "login"] },
  { skill: "Python", category: "data", aliases: ["python"] },
  { skill: "SQL", category: "data", aliases: ["sql", "queries", "data analysis"] },
  { skill: "Git", category: "tools", aliases: ["git", "github", "version control"] },
  { skill: "Docker", category: "tools", aliases: ["docker", "container"] },
  { skill: "Testing", category: "tools", aliases: ["testing", "unit test", "integration test", "playwright", "jest"] },
  { skill: "Agile", category: "process", aliases: ["agile", "scrum", "kanban"] },
  { skill: "German", category: "language", aliases: ["german", "deutsch"] },
  { skill: "English", category: "language", aliases: ["english", "englisch"] },
];

const requiredSignals = [
  "required",
  "must have",
  "must-have",
  "you have",
  "you bring",
  "requirements",
  "essential",
  "strong knowledge",
  "experience with",
];

const niceSignals = [
  "nice to have",
  "nice-to-have",
  "preferred",
  "bonus",
  "plus",
  "advantage",
  "ideally",
  "optional",
];

export function analyzeJobDescription(jobDescription: string): JobAnalysis {
  const rawText = jobDescription.trim();
  const text = rawText.toLowerCase();

  const skills = skillDictionary
    .map((entry) => {
      const hits = countMatches(text, entry.aliases);
      if (hits === 0) return null;
      return {
        skill: entry.skill,
        category: entry.category,
        requirement: classifyRequirement(text, entry.aliases),
        hits,
      } satisfies SkillMatch;
    })
    .filter((match): match is SkillMatch => Boolean(match))
    .sort((a, b) => b.hits - a.hits || a.skill.localeCompare(b.skill));

  const languageRequirements = unique([
    text.includes("german") || text.includes("deutsch") ? extractLanguageLevel(text, "German") : "",
    text.includes("english") || text.includes("englisch") ? extractLanguageLevel(text, "English") : "",
  ]);

  const locationSignals = unique([
    ...["berlin", "frankfurt", "munich", "münchen", "hamburg", "cologne", "köln", "stuttgart"].filter(
      (city) => text.includes(city),
    ),
    text.includes("germany") || text.includes("deutschland") ? "Germany" : "",
  ]).map((signal) => signal.charAt(0).toUpperCase() + signal.slice(1));

  const workMode = text.includes("hybrid")
    ? "Hybrid"
    : text.includes("remote")
      ? "Remote"
      : text.includes("on-site") || text.includes("onsite")
        ? "On-site"
        : "Not specified";

  const roleType = classifyRoleType(text);
  const responsibilities = extractResponsibilities(rawText);
  const requiredSkills = skills.filter((skill) => skill.requirement === "required");
  const niceToHaveSkills = skills.filter((skill) => skill.requirement === "nice-to-have");

  return {
    requiredSkills,
    niceToHaveSkills,
    languageRequirements,
    locationSignals,
    workMode,
    roleType,
    responsibilities,
    fitSummary: buildFitSummary(requiredSkills, niceToHaveSkills, languageRequirements, roleType),
  };
}

function classifyRequirement(text: string, aliases: string[]) {
  const segments = text
    .split(/[\n.;]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const matchingSegments = segments.filter((segment) =>
    aliases.some((alias) => countMatches(segment, [alias]) > 0),
  );
  const hasNiceSignal = matchingSegments.some((segment) =>
    niceSignals.some((signal) => segment.includes(signal)),
  );
  const hasRequiredSignal = matchingSegments.some((segment) =>
    requiredSignals.some((signal) => segment.includes(signal)),
  );

  if (hasNiceSignal) return "nice-to-have";
  if (hasRequiredSignal) return "required";
  return "required";
}

function extractLanguageLevel(text: string, language: "German" | "English") {
  const languagePattern =
    language === "German"
      ? /(?:german|deutsch)\s*(?:level\s*)?\b(a1|a2|b1|b2|c1|c2)\b|\b(a1|a2|b1|b2|c1|c2)\b\s*(?:level\s*)?(?:german|deutsch)/i
      : /(?:english|englisch)\s*(?:level\s*)?\b(a1|a2|b1|b2|c1|c2)\b|\b(a1|a2|b1|b2|c1|c2)\b\s*(?:level\s*)?(?:english|englisch)/i;
  const levelMatch = text.match(languagePattern);
  const level = levelMatch?.[1] ?? levelMatch?.[2];
  return level ? `${language} ${level.toUpperCase()}` : language;
}

function classifyRoleType(text: string) {
  if (text.includes("working student")) return "Working student";
  if (text.includes("intern")) return "Internship";
  if (text.includes("frontend") || text.includes("react")) return "Frontend development";
  if (text.includes("full stack") || text.includes("fullstack")) return "Full-stack development";
  if (text.includes("data analyst") || text.includes("analytics")) return "Data analytics";
  if (text.includes("ui/ux") || text.includes("product designer")) return "Product design";
  return "Early-career tech role";
}

function extractResponsibilities(rawText: string) {
  const lines = rawText
    .split(/\n|•|-/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 32 && line.length <= 180);

  const responsibilityLines = lines.filter((line) =>
    /build|develop|implement|support|maintain|collaborate|analy[sz]e|design|improve|document|test/i.test(line),
  );

  return unique(responsibilityLines).slice(0, 5);
}

function buildFitSummary(
  requiredSkills: SkillMatch[],
  niceToHaveSkills: SkillMatch[],
  languageRequirements: string[],
  roleType: string,
) {
  const topRequired = requiredSkills.slice(0, 4).map((skill) => skill.skill);
  const topNice = niceToHaveSkills.slice(0, 2).map((skill) => skill.skill);
  const languageText =
    languageRequirements.length > 0
      ? ` Language signal: ${languageRequirements.join(", ")}.`
      : " No explicit language level was detected.";

  if (topRequired.length === 0) {
    return `This looks like a ${roleType.toLowerCase()} but the parser did not find enough known skills yet. Add more JD text or extend the dictionary.`;
  }

  return `This ${roleType.toLowerCase()} mainly asks for ${topRequired.join(", ")}.${
    topNice.length ? ` Nice-to-have signals include ${topNice.join(", ")}.` : ""
  }${languageText} Map every required skill to proof before using it in a CV bullet.`;
}
