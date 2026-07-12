"use client";

import { ClipboardCheck, FileSearch } from "lucide-react";
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
import type { JobAnalysis, SkillConfidence, SkillMatch } from "@/lib/analyzer-types";
import type { ApplicationOption } from "@/components/jd-evidence-types";

export function JdAnalyzerPanel({
  aiSettings,
  analysis,
  applications,
  canPersistEvidence,
  evidenceMap,
  evidenceTableReady,
  jobDescription,
  onJobDescriptionChange,
  onSelectApplication,
  selectedApplicationId,
  sprintSkills,
}: {
  aiSettings: AiProviderSettingSummary[];
  analysis: JobAnalysis;
  applications: ApplicationOption[];
  canPersistEvidence: boolean;
  evidenceMap: Record<string, EvidenceRow>;
  evidenceTableReady: boolean;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onSelectApplication: (value: string) => void;
  selectedApplicationId: string;
  sprintSkills: SkillMatch[];
}) {
  return (
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
          onChange={(event) => onSelectApplication(event.target.value)}
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
          onChange={(event) => onJobDescriptionChange(event.target.value)}
          value={jobDescription}
        />
      </label>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InsightTile label="Role type" value={analysis.roleType} />
        <InsightTile label="Work mode" value={analysis.workMode} />
        <InsightTile label="Language" value={analysis.languageRequirements.join(", ") || "Not detected"} />
        <InsightTile label="Location" value={analysis.locationSignals.join(", ") || "Not detected"} />
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">Fit summary</p>
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
  );
}

export function EvidenceMapPanel({
  analysis,
  canPersistEvidence,
  cvReadyCount,
  errorBySkill,
  evidenceMap,
  evidenceSkills,
  onCreateSprint,
  onImproveSkill,
  onSaveEvidence,
  onSaveSprintTask,
  onSprintDaysChange,
  onUpdateEvidence,
  onUpdateSprintTask,
  saveStateBySkill,
  selectedConfidence,
  selectedSprintSkill,
  sprint,
  sprintDays,
  sprintMessage,
  sprintStatus,
}: {
  analysis: JobAnalysis;
  canPersistEvidence: boolean;
  cvReadyCount: number;
  errorBySkill: Record<string, string | null>;
  evidenceMap: Record<string, EvidenceRow>;
  evidenceSkills: SkillMatch[];
  onCreateSprint: () => void;
  onImproveSkill: () => void;
  onSaveEvidence: (skill: SkillMatch) => Promise<void>;
  onSaveSprintTask: (task: LearningSprintTask) => Promise<void>;
  onSprintDaysChange: (days: 3 | 7 | 14) => void;
  onUpdateEvidence: (skill: string, updates: Partial<EvidenceRow>) => void;
  onUpdateSprintTask: (taskId: string, updates: Partial<LearningSprintTask>) => void;
  saveStateBySkill: Record<string, EvidenceSaveState>;
  selectedConfidence: SkillConfidence;
  selectedSprintSkill?: SkillMatch;
  sprint: LearningSprint | null;
  sprintDays: 3 | 7 | 14;
  sprintMessage: string | null;
  sprintStatus: SprintStatus;
}) {
  return (
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
          <p className="font-serif text-3xl leading-none">{cvReadyCount}/{evidenceSkills.length || 0}</p>
        </div>
      </div>

      <SkillSummary title="Required skills" skills={analysis.requiredSkills} tone="required" />
      <SkillSummary title="Nice-to-have skills" skills={analysis.niceToHaveSkills} tone="nice" />

      <EvidenceMapTable
        canPersistEvidence={canPersistEvidence}
        errorBySkill={errorBySkill}
        evidenceMap={evidenceMap}
        onSaveEvidence={onSaveEvidence}
        onUpdateEvidence={onUpdateEvidence}
        saveStateBySkill={saveStateBySkill}
        skills={evidenceSkills}
      />

      <div className="mt-4 rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">Responsibilities detected</p>
        <ul className="space-y-2 text-sm leading-6 text-white/76">
          {(analysis.responsibilities.length ? analysis.responsibilities : ["No responsibility bullets detected yet."]).map(
            (responsibility) => <li key={responsibility}>• {responsibility}</li>,
          )}
        </ul>
      </div>

      <LearningSprintPanel
        onCreateSprint={onCreateSprint}
        onImproveSkill={onImproveSkill}
        onSaveSprintTask={onSaveSprintTask}
        onSprintDaysChange={onSprintDaysChange}
        onUpdateSprintTask={onUpdateSprintTask}
        selectedConfidence={selectedConfidence}
        selectedSprintSkill={selectedSprintSkill}
        sprint={sprint}
        sprintDays={sprintDays}
        sprintMessage={sprintMessage}
        sprintStatus={sprintStatus}
      />
    </article>
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">{title}</p>
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
