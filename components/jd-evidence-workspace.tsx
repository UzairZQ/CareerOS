"use client";

import {
  ClipboardCheck,
  FileSearch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AiInsightButton, type AiProviderSettingSummary } from "@/components/ai-insight-button";
import {
  EvidenceMapTable,
  type EvidenceRow,
  type EvidenceSaveState,
} from "@/components/evidence-map-table";
import {
  LearningSprintPanel,
  type LearningSprint,
  type LearningSprintTask,
  type SprintStatus,
} from "@/components/learning-sprint-panel";
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
  learningSprintSchema,
  learningSprintTaskProofSchema,
} from "@/lib/dashboard-validation";
import { createClient } from "@/lib/supabase/browser";

type ApplicationOption = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
};

type InitialEvidenceItem = {
  application_id: string | null;
  skill: string;
  evidence_summary: string | null;
  confidence: SkillConfidence;
  proof_url: string | null;
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
  const router = useRouter();
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
  const [saveStateBySkill, setSaveStateBySkill] = useState<Record<string, EvidenceSaveState>>({});
  const [errorBySkill, setErrorBySkill] = useState<Record<string, string | null>>({});
  const [sprintDays, setSprintDays] = useState<3 | 7 | 14>(7);
  const [sprint, setSprint] = useState<LearningSprint | null>(null);
  const [sprintStatus, setSprintStatus] = useState<SprintStatus>("idle");
  const [sprintMessage, setSprintMessage] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    async function loadSprint() {
      if (!selectedApplication || !selectedSprintSkill) {
        setSprint(null);
        setSprintStatus("idle");
        setSprintMessage(null);
        return;
      }

      setSprintStatus("loading");
      setSprintMessage(null);
      const supabase = createClient();
      const { data: sprintRow, error: sprintError } = await supabase
        .from("learning_sprints")
        .select("id, application_id, skill, duration_days, status")
        .eq("application_id", selectedApplication.id)
        .eq("skill", selectedSprintSkill.skill)
        .maybeSingle();

      if (cancelled) return;

      if (sprintError) {
        setSprint(null);
        setSprintStatus("error");
        setSprintMessage("Learning Sprint storage is not ready. Run the latest Supabase migration.");
        return;
      }

      if (!sprintRow) {
        setSprint(null);
        setSprintStatus("idle");
        return;
      }

      const { data: taskRows, error: taskError } = await supabase
        .from("learning_sprint_tasks")
        .select("id, task_order, title, proof_url, proof_note, completed")
        .eq("sprint_id", sprintRow.id)
        .order("task_order", { ascending: true });

      if (cancelled) return;

      if (taskError) {
        setSprint(null);
        setSprintStatus("error");
        setSprintMessage("The sprint exists, but its tasks could not be loaded.");
        return;
      }

      setSprint({
        ...sprintRow,
        duration_days: sprintRow.duration_days as 3 | 7 | 14,
        status: sprintRow.status as LearningSprint["status"],
        tasks: taskRows ?? [],
      });
      setSprintStatus("idle");
    }

    void loadSprint();
    return () => {
      cancelled = true;
    };
  }, [selectedApplication, selectedSprintSkill]);

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
      return;
    }

    router.refresh();
  }

  async function createSprint() {
    if (!selectedApplication || !selectedSprintSkill) return;

    const parsedSprint = learningSprintSchema.safeParse({
      application_id: selectedApplication.id,
      duration_days: sprintDays,
      skill: selectedSprintSkill.skill,
      user_id: userId,
    });

    if (!parsedSprint.success) {
      setSprintStatus("error");
      setSprintMessage(formatValidationError(parsedSprint.error));
      return;
    }

    setSprintStatus("creating");
    setSprintMessage(null);
    const supabase = createClient();
    const { data: sprintRow, error: sprintError } = await supabase
      .from("learning_sprints")
      .upsert(
        {
          ...parsedSprint.data,
          status: "active",
        },
        { onConflict: "user_id,application_id,skill" },
      )
      .select("id, application_id, skill, duration_days, status")
      .single();

    if (sprintError || !sprintRow) {
      setSprintStatus("error");
      setSprintMessage(sprintError?.message ?? "Could not create the learning sprint.");
      return;
    }

    const { error: deleteTasksError } = await supabase
      .from("learning_sprint_tasks")
      .delete()
      .eq("sprint_id", sprintRow.id);
    if (deleteTasksError) {
      setSprintStatus("error");
      setSprintMessage(deleteTasksError.message);
      return;
    }

    const taskTitles = createLearningSprint(selectedSprintSkill.skill, sprintDays);
    const { data: taskRows, error: taskError } = await supabase
      .from("learning_sprint_tasks")
      .insert(
        taskTitles.map((title, index) => ({
          sprint_id: sprintRow.id,
          task_order: index + 1,
          title,
        })),
      )
      .select("id, task_order, title, proof_url, proof_note, completed")
      .order("task_order", { ascending: true });

    if (taskError) {
      setSprintStatus("error");
      setSprintMessage(taskError.message);
      return;
    }

    setSprint({
      ...sprintRow,
      duration_days: sprintRow.duration_days as 3 | 7 | 14,
      status: sprintRow.status as LearningSprint["status"],
      tasks: taskRows ?? [],
    });
    setSprintStatus("idle");
    setSprintMessage("Sprint created. Add proof as you complete each task.");
  }

  function updateSprintTask(taskId: string, updates: Partial<LearningSprintTask>) {
    setSprint((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task,
            ),
          }
        : current,
    );
    setSprintMessage(null);
  }

  async function saveSprintTask(task: LearningSprintTask) {
    const parsedProof = learningSprintTaskProofSchema.safeParse({
      proof_note: task.proof_note,
      proof_url: task.proof_url,
    });

    if (!parsedProof.success) {
      setSprintStatus("error");
      setSprintMessage(formatValidationError(parsedProof.error));
      return;
    }

    if (!parsedProof.data.proof_url && !parsedProof.data.proof_note) {
      setSprintStatus("error");
      setSprintMessage("Add a proof link or note before completing this task.");
      return;
    }

    setSprintStatus("saving");
    setSprintMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("learning_sprint_tasks")
      .update({
        ...parsedProof.data,
        completed: true,
      })
      .eq("id", task.id);

    if (error) {
      setSprintStatus("error");
      setSprintMessage(error.message);
      return;
    }

    updateSprintTask(task.id, {
      ...parsedProof.data,
      completed: true,
    });
    setSprintStatus("idle");
    setSprintMessage("Proof saved for this task.");
  }

  async function improveSkillFromSprint() {
    // Task proof and skill improvement are separate writes: every task must be proven
    // before the Evidence Map confidence can move from learning to basic.
    if (!selectedApplication || !selectedSprintSkill || !sprint) return;

    const allTasksHaveProof = sprint.tasks.length > 0 && sprint.tasks.every((task) => task.proof_url?.trim());
    if (!allTasksHaveProof) {
      setSprintStatus("error");
      setSprintMessage("Add a proof link to every sprint task before improving this skill.");
      return;
    }

    const currentRow = evidenceMap[selectedSprintSkill.skill] ?? {
      evidence: "",
      confidence: "learning" as SkillConfidence,
      proofLink: "",
    };
    const firstProofLink = sprint.tasks.find((task) => task.proof_url?.trim())?.proof_url ?? null;
    const evidencePayload = {
      application_id: selectedApplication.id,
      confidence: "basic" as const,
      evidence_summary:
        currentRow.evidence.trim() ||
        `Completed a ${sprint.duration_days}-day ${selectedSprintSkill.skill} learning sprint with proof-backed tasks.`,
      evidence_type: "learning_task" as const,
      proof_task: createProofTask(selectedSprintSkill.skill, "basic"),
      proof_url: currentRow.proofLink.trim() || firstProofLink,
      requirement: selectedSprintSkill.requirement,
      skill: selectedSprintSkill.skill,
      skill_category: selectedSprintSkill.category,
      user_id: userId,
    };
    const parsedEvidence = evidenceItemSchema.safeParse(evidencePayload);

    if (!parsedEvidence.success) {
      setSprintStatus("error");
      setSprintMessage(formatValidationError(parsedEvidence.error));
      return;
    }

    setSprintStatus("saving");
    setSprintMessage(null);
    const supabase = createClient();
    const { error: evidenceError } = await supabase
      .from("evidence_items")
      .upsert(parsedEvidence.data, { onConflict: "user_id,application_id,skill" });

    if (evidenceError) {
      setSprintStatus("error");
      setSprintMessage(evidenceError.message);
      return;
    }

    const { error: sprintError } = await supabase
      .from("learning_sprints")
      .update({ status: "completed" })
      .eq("id", sprint.id);

    if (sprintError) {
      setSprintStatus("error");
      setSprintMessage(`Skill improved, but sprint status could not be updated: ${sprintError.message}`);
      return;
    }

    setEvidenceMap((current) => ({
      ...current,
      [selectedSprintSkill.skill]: {
        evidence: parsedEvidence.data.evidence_summary ?? "",
        confidence: "basic",
        proofLink: parsedEvidence.data.proof_url ?? "",
      },
    }));
    setSprint((current) => (current ? { ...current, status: "completed" } : current));
    setSprintStatus("idle");
    setSprintMessage("Skill improved to Basic. Keep the proof link attached before using it in a CV claim.");
    router.refresh();
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

        <EvidenceMapTable
          canPersistEvidence={canPersistEvidence}
          errorBySkill={errorBySkill}
          evidenceMap={evidenceMap}
          onSaveEvidence={saveEvidence}
          onUpdateEvidence={updateEvidence}
          saveStateBySkill={saveStateBySkill}
          skills={evidenceSkills}
        />

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

        <LearningSprintPanel
          onCreateSprint={createSprint}
          onImproveSkill={improveSkillFromSprint}
          onSaveSprintTask={saveSprintTask}
          onSprintDaysChange={setSprintDays}
          onUpdateSprintTask={updateSprintTask}
          selectedConfidence={evidenceMap[selectedSprintSkill?.skill ?? ""]?.confidence ?? "missing"}
          selectedSprintSkill={selectedSprintSkill}
          sprint={sprint}
          sprintDays={sprintDays}
          sprintMessage={sprintMessage}
          sprintStatus={sprintStatus}
        />
      </article>
    </section>
  );
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
