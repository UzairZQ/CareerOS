"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type AiProviderSettingSummary } from "@/components/ai-insight-button";
import {
  type EvidenceRow,
  type EvidenceSaveState,
} from "@/components/evidence-map-table";
import {
  EvidenceMapPanel,
  JdAnalyzerPanel,
} from "@/components/jd-evidence-panels";
import type {
  ApplicationOption,
  InitialEvidenceItem,
} from "@/components/jd-evidence-types";
import {
  type LearningSprint,
  type LearningSprintTask,
  type SprintStatus,
} from "@/components/learning-sprint-panel";
import {
  analyzeJobDescription,
  createLearningSprint,
  createProofTask,
  hasSprintTaskProof,
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
  }, [evidenceSkills, initialEvidence, selectedApplicationId]);

  useEffect(() => {
    // A server refresh after saving should not erase the temporary success state.
    // Reset it only when the user changes the selected job or its JD.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveStateBySkill({});
    setErrorBySkill({});
  }, [jobDescription, selectedApplicationId]);

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

    const allTasksHaveProof = sprint.tasks.length > 0 && sprint.tasks.every(hasSprintTaskProof);
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
      <JdAnalyzerPanel
        aiSettings={aiSettings}
        analysis={analysis}
        applications={applications}
        canPersistEvidence={canPersistEvidence}
        evidenceMap={evidenceMap}
        evidenceTableReady={evidenceTableReady}
        jobDescription={jobDescription}
        onJobDescriptionChange={(value) => {
          setSelectedApplicationId("manual");
          setManualJobDescription(value);
        }}
        onSelectApplication={setSelectedApplicationId}
        selectedApplicationId={selectedApplicationId}
        sprintSkills={sprintSkills}
      />
      <EvidenceMapPanel
        analysis={analysis}
        canPersistEvidence={canPersistEvidence}
        cvReadyCount={cvReadyCount}
        errorBySkill={errorBySkill}
        evidenceMap={evidenceMap}
        evidenceSkills={evidenceSkills}
        onCreateSprint={createSprint}
        onImproveSkill={improveSkillFromSprint}
        onSaveEvidence={saveEvidence}
        onSaveSprintTask={saveSprintTask}
        onSprintDaysChange={setSprintDays}
        onUpdateEvidence={updateEvidence}
        onUpdateSprintTask={updateSprintTask}
        saveStateBySkill={saveStateBySkill}
        selectedConfidence={evidenceMap[selectedSprintSkill?.skill ?? ""]?.confidence ?? "missing"}
        selectedSprintSkill={selectedSprintSkill}
        sprint={sprint}
        sprintDays={sprintDays}
        sprintMessage={sprintMessage}
        sprintStatus={sprintStatus}
      />
    </section>
  );
}
