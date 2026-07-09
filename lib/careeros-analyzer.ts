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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, aliases: string[]) {
  return aliases.reduce((total, alias) => {
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(alias)}(?=[^a-z0-9+#]|$)`, "gi");
    return total + [...text.matchAll(pattern)].length;
  }, 0);
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

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

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

export function createProofTask(skill: string, confidence: SkillConfidence) {
  if (confidence === "direct") return "Attach a direct project, work sample, certificate, or repo link.";
  if (confidence === "bridge") return `Write a 2-line bridge from nearby experience to ${skill}, then attach proof.`;
  if (confidence === "basic") return `Build a small ${skill} proof task and add a GitHub or note link.`;
  if (confidence === "learning") return `Create a 3-day learning sprint for ${skill} and submit proof before improving confidence.`;
  return `Do not claim ${skill} yet. Create a learning task with external proof first.`;
}

export function createLearningSprint(skill: string, days: 3 | 7 | 14) {
  if (days === 3) {
    return [
      `Day 1: Read one focused ${skill} guide and write five notes in your own words.`,
      `Day 2: Build a tiny ${skill} proof that solves one concrete job-task scenario.`,
      `Day 3: Publish the proof, add a README, and link the exact commit or deployment.`,
    ];
  }

  if (days === 7) {
    return [
      `Day 1: Define the ${skill} requirement from the JD and list what proof would satisfy it.`,
      `Day 2: Complete one practical tutorial, then delete the tutorial code and rebuild the core idea.`,
      `Day 3: Add the first working version to a public or private GitHub repo.`,
      `Day 4: Add one realistic edge case, test, or accessibility/performance improvement.`,
      `Day 5: Write a README section explaining the decision tradeoffs.`,
      `Day 6: Record proof: commit link, screenshot, note, certificate, or deployment.`,
      `Day 7: Convert the proof into one honest CV bullet angle without exaggeration.`,
    ];
  }

  return [
    `Days 1-2: Study the ${skill} fundamentals and collect examples from two credible sources.`,
    `Days 3-4: Build a minimal proof project focused only on the JD requirement.`,
    `Days 5-6: Add realistic data, states, errors, or edge cases so the proof is not toy-like.`,
    `Days 7-8: Add tests, documentation, or a short architecture note.`,
    `Days 9-10: Ask whether the proof shows direct, bridge, basic, or learning-level confidence.`,
    `Days 11-12: Polish the proof link, README, screenshots, and deployment if relevant.`,
    `Day 13: Write one evidence-backed CV bullet and one interview explanation.`,
    `Day 14: Review the evidence map and only improve confidence after proof is linked.`,
  ];
}

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

  if (riskyClaims.length > 0) {
    suggestions.push("Downgrade or prove broad claims before they appear in your CV.");
  }

  if (bulletIssues.length > 0) {
    suggestions.push("Rewrite weak bullets into evidence-backed outcomes: action, scope, proof, result.");
  }

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
