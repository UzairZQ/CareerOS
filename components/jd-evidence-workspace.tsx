"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  ClipboardCheck,
  FileSearch,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AiInsightButton, type AiProviderSettingSummary } from "@/components/ai-insight-button";
import {
  analyzeJobDescription,
  createLearningSprint,
  createProofTask,
  type SkillConfidence,
  type SkillMatch,
} from "@/lib/careeros-analyzer";
import {
  evidenceItemSchema,
  formatValidationError,
} from "@/lib/dashboard-validation";
import { createClient } from "@/lib/supabase/browser";

type ApplicationOption = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
};

type EvidenceRow = {
  evidence: string;
  confidence: SkillConfidence;
  proofLink: string;
};

type InitialEvidenceItem = {
  application_id: string | null;
  skill: string;
  evidence_summary: string | null;
  confidence: SkillConfidence;
  proof_url: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

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

export function JdEvidenceWorkspace({
  applications,
  evidenceTableReady = true,
  aiSettings,
  initialEvidence,
  userId,
}: {
  applications: ApplicationOption[];
  evidenceTableReady?: boolean;
  aiSettings: AiProviderSettingSummary[];
  initialEvidence: InitialEvidenceItem[];
  userId: string;
}) {
  const firstApplicationWithJd = applications.find((application) => application.job_description);
  const [selectedApplicationId, setSelectedApplicationId] = useState(firstApplicationWithJd?.id ?? "manual");
  const selectedApplication = applications.find((application) => application.id === selectedApplicationId);
  const [manualJobDescription, setManualJobDescription] = useState(
    firstApplicationWithJd?.job_description?.trim() || "",
  );
  const jobDescription = selectedApplication?.job_description?.trim() || manualJobDescription;
  // The analyzer result is also used as an effect dependency below; keep it stable
  // while the editable JD text has not changed.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const analysis = useMemo(() => analyzeJobDescription(jobDescription), [jobDescription]);
  const evidenceSkills = analysis.requiredSkills.length > 0 ? analysis.requiredSkills : analysis.niceToHaveSkills;
  const [evidenceMap, setEvidenceMap] = useState<Record<string, EvidenceRow>>({});
  const [saveStateBySkill, setSaveStateBySkill] = useState<Record<string, SaveState>>({});
  const [errorBySkill, setErrorBySkill] = useState<Record<string, string | null>>({});
  const [sprintDays, setSprintDays] = useState<3 | 7 | 14>(7);
  const canPersistEvidence = Boolean(
    selectedApplication?.job_description?.trim() && evidenceTableReady,
  );

  useEffect(() => {
    const persistedEvidence = initialEvidence.filter(
      (item) => item.application_id && item.application_id === selectedApplicationId,
    );

    // Server-backed evidence is copied into editable local drafts when the selected JD changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvidenceMap((current) => {
      const next: Record<string, EvidenceRow> = {};
      evidenceSkills.forEach((skill) => {
        const persisted = persistedEvidence.find((item) => item.skill === skill.skill);
        next[skill.skill] = persisted
          ? {
              evidence: persisted.evidence_summary ?? "",
              confidence: persisted.confidence,
              proofLink: persisted.proof_url ?? "",
            }
          : current[skill.skill] ?? {
              evidence: "",
              confidence: "missing",
              proofLink: "",
          };
      });
      const isUnchanged =
        Object.keys(current).length === Object.keys(next).length &&
        Object.entries(next).every(([skill, row]) => {
          const previous = current[skill];
          return (
            previous?.evidence === row.evidence &&
            previous?.confidence === row.confidence &&
            previous?.proofLink === row.proofLink
          );
        });

      return isUnchanged ? current : next;
    });
    setSaveStateBySkill((current) => (Object.keys(current).length === 0 ? current : {}));
  }, [evidenceSkills, initialEvidence, selectedApplicationId]);

  const cvReadyCount = evidenceSkills.filter((skill) => {
    const row = evidenceMap[skill.skill];
    return (
      row?.evidence.trim() &&
      row?.proofLink.trim() &&
      row?.confidence !== "missing" &&
      row?.confidence !== "learning"
    );
  }).length;
  const sprintSkills = evidenceSkills.filter((skill) => {
    const row = evidenceMap[skill.skill];
    return !row?.evidence.trim() || row.confidence === "missing" || row.confidence === "learning" || row.confidence === "basic";
  });
  const selectedSprintSkill = sprintSkills[0];

  function updateEvidence(skill: string, updates: Partial<EvidenceRow>) {
    setEvidenceMap((current) => ({
      ...current,
      [skill]: {
        evidence: current[skill]?.evidence ?? "",
        confidence: current[skill]?.confidence ?? "missing",
        proofLink: current[skill]?.proofLink ?? "",
        ...updates,
      },
    }));
    setSaveStateBySkill((current) => ({ ...current, [skill]: "idle" }));
    setErrorBySkill((current) => ({ ...current, [skill]: null }));
  }

  async function saveEvidence(skill: SkillMatch) {
    if (!selectedApplication) return;

    const row = evidenceMap[skill.skill] ?? {
      evidence: "",
      confidence: "missing" as SkillConfidence,
      proofLink: "",
    };
    const evidencePayload = {
      user_id: userId,
      application_id: selectedApplication.id,
      skill: skill.skill,
      skill_category: skill.category,
      requirement: skill.requirement,
      evidence_type:
        row.confidence === "learning" || row.confidence === "missing" ? "learning_task" : "other",
      evidence_summary: row.evidence.trim() || null,
      confidence: row.confidence,
      proof_url: row.proofLink.trim() || null,
      proof_task: createProofTask(skill.skill, row.confidence),
    };
    const parsedEvidence = evidenceItemSchema.safeParse(evidencePayload);

    if (!parsedEvidence.success) {
      setSaveStateBySkill((current) => ({ ...current, [skill.skill]: "error" }));
      setErrorBySkill((current) => ({
        ...current,
        [skill.skill]: formatValidationError(parsedEvidence.error),
      }));
      return;
    }

    setSaveStateBySkill((current) => ({ ...current, [skill.skill]: "saving" }));
    setErrorBySkill((current) => ({ ...current, [skill.skill]: null }));
    const supabase = createClient();

    const { error } = await supabase.from("evidence_items").upsert(
      parsedEvidence.data,
      { onConflict: "user_id,application_id,skill" },
    );

    setSaveStateBySkill((current) => ({ ...current, [skill.skill]: error ? "error" : "saved" }));
    if (error) {
      setErrorBySkill((current) => ({ ...current, [skill.skill]: error.message }));
    }
  }

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <article className="card-sheen rounded-[22px] border border-white/10 p-4 shadow-dashboard-card md:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
              <FileSearch size={17} strokeWidth={1.8} />
              JD Analyzer
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
              Extract the real ask
            </h2>
          </div>
          <span className="stamp rounded-full px-3 py-2 text-[0.67rem] font-semibold uppercase">
            Rule-based
          </span>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium text-white/74">Application source</span>
          <select
            className="dashboard-input w-full"
            onChange={(event) => setSelectedApplicationId(event.target.value)}
            value={selectedApplicationId}
          >
            <option value="manual">Manual paste</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.company} - {application.role}
              </option>
            ))}
          </select>
        </label>

        {!canPersistEvidence && (
          <div className="mb-4 rounded-[18px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
            Analysis works in manual mode. To save evidence, add or select a saved application with a job description.
          </div>
        )}

        {!evidenceTableReady && (
          <div className="mb-4 rounded-[18px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
            Evidence saving is waiting for the latest Supabase schema. Run the updated{" "}
            <code className="rounded bg-black/20 px-1.5 py-1">supabase/schema.sql</code>.
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/74">Job description text</span>
          <textarea
            className="dashboard-input min-h-[220px] w-full resize-y leading-6"
            onChange={(event) => {
              setSelectedApplicationId("manual");
              setManualJobDescription(event.target.value);
            }}
            value={jobDescription}
          />
        </label>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InsightTile label="Role type" value={analysis.roleType} />
          <InsightTile label="Work mode" value={analysis.workMode} />
          <InsightTile
            label="Language"
            value={analysis.languageRequirements.join(", ") || "Not detected"}
          />
          <InsightTile
            label="Location"
            value={analysis.locationSignals.join(", ") || "Not detected"}
          />
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
            Fit summary
          </p>
          <p className="text-sm leading-6 text-white/78">{analysis.fitSummary}</p>
        </div>

        <div className="mt-4">
          <AiInsightButton
            input={{
              evidenceMap,
              fitSummary: analysis.fitSummary,
              languageRequirements: analysis.languageRequirements,
              missingOrWeakSkills: sprintSkills.map((skill) => skill.skill),
              requiredSkills: analysis.requiredSkills.map((skill) => skill.skill),
            }}
            kind="skill-gap"
            settings={aiSettings}
          />
        </div>
      </article>

      <article className="card-sheen rounded-[22px] border border-white/10 p-4 shadow-dashboard-card md:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
              <ClipboardCheck size={17} strokeWidth={1.8} />
              Evidence Map
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
              Proof before claims
            </h2>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-[#171A1F]/58 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">CV-ready</p>
            <p className="font-serif text-3xl leading-none">
              {cvReadyCount}/{evidenceSkills.length || 0}
            </p>
          </div>
        </div>

        <SkillSummary title="Required skills" skills={analysis.requiredSkills} tone="required" />
        <SkillSummary title="Nice-to-have skills" skills={analysis.niceToHaveSkills} tone="nice" />

        <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
          <div className="grid grid-cols-[1fr_1.08fr_0.82fr] bg-[#171A1F]/72 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
            <span>Skill</span>
            <span>Evidence</span>
            <span>Proof task</span>
          </div>

          {evidenceSkills.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#AEB6C2]">
              Paste a detailed job description to build an evidence map.
            </div>
          ) : (
            evidenceSkills.map((skill) => {
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
                        updateEvidence(skill.skill, {
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
                      onChange={(event) => updateEvidence(skill.skill, { evidence: event.target.value })}
                      placeholder={`Project, course, work example, or honest bridge for ${skill.skill}`}
                      value={row.evidence}
                    />
                    <input
                      className="dashboard-input min-h-0 w-full py-2 text-sm"
                      data-testid={`evidence-proof-${skillId}`}
                      onChange={(event) => updateEvidence(skill.skill, { proofLink: event.target.value })}
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
                      onClick={() => saveEvidence(skill)}
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

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
            Responsibilities detected
          </p>
          <ul className="space-y-2 text-sm leading-6 text-white/76">
            {(analysis.responsibilities.length ? analysis.responsibilities : ["No responsibility bullets detected yet."]).map(
              (responsibility) => (
                <li key={responsibility}>• {responsibility}</li>
              ),
            )}
          </ul>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
                <BookOpenCheck size={17} strokeWidth={1.8} />
                Learning Sprint
              </p>
              <p className="text-sm leading-6 text-white/72">
                Generated for the first weak skill. Improve confidence only after proof is linked.
              </p>
            </div>
            <div className="flex rounded-2xl border border-white/10 bg-[#303849] p-1">
              {([3, 7, 14] as const).map((days) => (
                <button
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    sprintDays === days
                      ? "bg-[#2C7BE5] text-white"
                      : "text-white/62 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  key={days}
                  onClick={() => setSprintDays(days)}
                  type="button"
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {selectedSprintSkill ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-3 py-1.5 text-xs font-semibold text-[#FFD8B0]">
                  {selectedSprintSkill.skill}
                </span>
                <span className="text-xs text-[#AEB6C2]">
                  {evidenceMap[selectedSprintSkill.skill]?.confidence ?? "missing"} confidence
                </span>
              </div>
              <ol className="space-y-2 text-sm leading-6 text-white/76">
                {createLearningSprint(selectedSprintSkill.skill, sprintDays).map((task, index) => (
                  <li
                    className="rounded-[14px] border border-white/10 bg-[#303849]/70 px-3 py-2"
                    key={task}
                  >
                    <span className="mr-2 font-semibold text-white/92">{index + 1}.</span>
                    {task}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#5C7A5C]/40 bg-[#5C7A5C]/14 px-4 py-3 text-sm text-[#DDF0DD]">
              Every mapped skill has enough evidence for now. Keep proof links fresh before using them in applications.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

function skillTestId(skill: string) {
  return skill.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function InsightTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#303849] p-4">
      <p className="mb-2 text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function SkillSummary({
  skills,
  title,
  tone,
}: {
  skills: SkillMatch[];
  title: string;
  tone: "required" | "nice";
}) {
  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill) => (
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                tone === "required"
                  ? "border-[#C77D2E]/40 bg-[#C77D2E]/12 text-[#FFD8B0]"
                  : "border-[#2C7BE5]/38 bg-[#2C7BE5]/12 text-[#D8E8FF]"
              }`}
              key={skill.skill}
            >
              {skill.skill}
            </span>
          ))
        ) : (
          <span className="text-sm text-[#AEB6C2]">None detected</span>
        )}
      </div>
    </div>
  );
}
