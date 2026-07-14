import type { SkillConfidence } from "@/lib/analyzer-types";

export function createProofTask(skill: string, confidence: SkillConfidence) {
  if (confidence === "direct") return "Attach a direct project, work sample, certificate, or repo link.";
  if (confidence === "bridge") return `Write a 2-line bridge from nearby experience to ${skill}, then attach proof.`;
  if (confidence === "basic") return `Build a small ${skill} proof task and add a GitHub or note link.`;
  if (confidence === "learning") return `Create a 3-day learning sprint for ${skill} and submit proof before improving confidence.`;
  return `Do not claim ${skill} yet. Create a learning task with external proof first.`;
}

export function hasSprintTaskProof(task: {
  proof_note?: string | null;
  proof_url?: string | null;
}) {
  return Boolean(task.proof_url?.trim() || task.proof_note?.trim());
}

export function hasSprintTaskLink(task: { proof_url?: string | null }) {
  return Boolean(task.proof_url?.trim());
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
