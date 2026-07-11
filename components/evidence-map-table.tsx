"use client";

import { AlertTriangle, Save, ShieldCheck } from "lucide-react";
import type { SkillConfidence, SkillMatch } from "@/lib/careeros-analyzer";
import { createProofTask } from "@/lib/careeros-analyzer";

export type EvidenceRow = {
  evidence: string;
  confidence: SkillConfidence;
  proofLink: string;
};

export type EvidenceSaveState = "idle" | "saving" | "saved" | "error";

const confidenceLabels: Record<SkillConfidence, string> = {
  direct: "Direct",
  bridge: "Bridge",
  basic: "Basic",
  learning: "Learning",
  missing: "Missing",
};

const confidenceClasses: Record<SkillConfidence, string> = {
  direct: "border-[#5C7A5C]/55 bg-[#5C7A5C]/18 text-[#DDF0DD]",
  bridge: "border-[#2C7BE5]/55 bg-[#2C7BE5]/16 text-[#D8E8FF]",
  basic: "border-white/14 bg-white/[0.07] text-white/78",
  learning: "border-[#C77D2E]/55 bg-[#C77D2E]/14 text-[#FFD8B0]",
  missing: "border-[#C77D2E]/60 bg-[#C77D2E]/20 text-[#FFD8B0]",
};

export function EvidenceMapTable({
  canPersistEvidence,
  errorBySkill,
  evidenceMap,
  saveStateBySkill,
  skills,
  onSaveEvidence,
  onUpdateEvidence,
}: {
  canPersistEvidence: boolean;
  errorBySkill: Record<string, string | null>;
  evidenceMap: Record<string, EvidenceRow>;
  saveStateBySkill: Record<string, EvidenceSaveState>;
  skills: SkillMatch[];
  onSaveEvidence: (skill: SkillMatch) => void;
  onUpdateEvidence: (skill: string, updates: Partial<EvidenceRow>) => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
      <div className="grid grid-cols-[1fr_1.08fr_0.82fr] bg-[#171A1F]/72 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
        <span>Skill</span>
        <span>Evidence</span>
        <span>Proof task</span>
      </div>

      {skills.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[#AEB6C2]">
          Paste a detailed job description to build an evidence map.
        </div>
      ) : (
        skills.map((skill) => {
          const skillId = skillTestId(skill.skill);
          const row = evidenceMap[skill.skill] ?? {
            evidence: "",
            confidence: "missing" as SkillConfidence,
            proofLink: "",
          };
          const isCvReady =
            row.evidence.trim() &&
            row.proofLink.trim() &&
            row.confidence !== "missing" &&
            row.confidence !== "learning";

          return (
            <div
              className="grid gap-3 border-t border-white/10 px-4 py-4 text-sm lg:grid-cols-[0.8fr_1.12fr_0.95fr]"
              data-testid={`evidence-row-${skillId}`}
              key={skill.skill}
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-white">{skill.skill}</span>
                  {isCvReady ? (
                    <ShieldCheck className="text-[#9BB99B]" size={16} strokeWidth={1.9} />
                  ) : (
                    <AlertTriangle className="text-[#C77D2E]" size={16} strokeWidth={1.9} />
                  )}
                </div>
                <p className="text-xs text-[#AEB6C2]">
                  {skill.category} · {skill.hits} signal{skill.hits === 1 ? "" : "s"}
                </p>
                <select
                  className={`mt-3 w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${confidenceClasses[row.confidence]}`}
                  data-testid={`evidence-confidence-${skillId}`}
                  onChange={(event) =>
                    onUpdateEvidence(skill.skill, {
                      confidence: event.target.value as SkillConfidence,
                    })
                  }
                  value={row.confidence}
                >
                  {Object.entries(confidenceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <textarea
                  className="dashboard-input min-h-[96px] w-full resize-y text-sm leading-5"
                  data-testid={`evidence-summary-${skillId}`}
                  onChange={(event) => onUpdateEvidence(skill.skill, { evidence: event.target.value })}
                  placeholder={`Project, course, work example, or honest bridge for ${skill.skill}`}
                  value={row.evidence}
                />
                <input
                  className="dashboard-input min-h-0 w-full py-2 text-sm"
                  data-testid={`evidence-proof-${skillId}`}
                  onChange={(event) => onUpdateEvidence(skill.skill, { proofLink: event.target.value })}
                  placeholder="Proof link: GitHub, note, deployment, certificate"
                  value={row.proofLink}
                />
              </div>

              <div className="rounded-[16px] border border-white/10 bg-[#171A1F]/50 p-3 text-xs leading-5 text-white/72">
                {createProofTask(skill.skill, row.confidence)}
                {!row.evidence.trim() && (
                  <p className="mt-3 font-semibold text-[#FFD8B0]">
                    Not CV-ready until evidence is added.
                  </p>
                )}
                {row.evidence.trim() && !row.proofLink.trim() && (
                  <p className="mt-3 font-semibold text-[#FFD8B0]">
                    Add proof before this can become CV-ready.
                  </p>
                )}
                <button
                  className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-xs font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-45"
                  data-testid={`evidence-save-${skillId}`}
                  disabled={!canPersistEvidence || saveStateBySkill[skill.skill] === "saving"}
                  onClick={() => onSaveEvidence(skill)}
                  type="button"
                >
                  <Save size={14} strokeWidth={1.9} />
                  {saveStateBySkill[skill.skill] === "saving"
                    ? "Saving..."
                    : saveStateBySkill[skill.skill] === "saved"
                      ? "Saved"
                      : "Save evidence"}
                </button>
                {saveStateBySkill[skill.skill] === "error" && (
                  <p className="mt-2 font-semibold text-[#FFD8B0]">
                    {errorBySkill[skill.skill] ?? "Could not save. Check the evidence table schema."}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function skillTestId(skill: string) {
  return skill.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
