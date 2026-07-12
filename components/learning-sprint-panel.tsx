"use client";

import { BookOpenCheck } from "lucide-react";
import type { SkillConfidence, SkillMatch } from "@/lib/careeros-analyzer";
import { hasSprintTaskProof } from "@/lib/learning-sprints";

export type LearningSprintTask = {
  id: string;
  task_order: number;
  title: string;
  proof_url: string | null;
  proof_note: string | null;
  completed: boolean;
};

export type LearningSprint = {
  id: string;
  application_id: string;
  skill: string;
  duration_days: 3 | 7 | 14;
  status: "active" | "completed" | "archived";
  tasks: LearningSprintTask[];
};

export type SprintStatus = "idle" | "loading" | "creating" | "saving" | "error";

type LearningSprintPanelProps = {
  selectedSprintSkill: SkillMatch | undefined;
  selectedConfidence: SkillConfidence;
  sprintDays: 3 | 7 | 14;
  sprint: LearningSprint | null;
  sprintStatus: SprintStatus;
  sprintMessage: string | null;
  onSprintDaysChange: (days: 3 | 7 | 14) => void;
  onCreateSprint: () => void;
  onUpdateSprintTask: (taskId: string, updates: Partial<LearningSprintTask>) => void;
  onSaveSprintTask: (task: LearningSprintTask) => void;
  onImproveSkill: () => void;
};

export function LearningSprintPanel({
  selectedSprintSkill,
  selectedConfidence,
  sprintDays,
  sprint,
  sprintStatus,
  sprintMessage,
  onSprintDaysChange,
  onCreateSprint,
  onUpdateSprintTask,
  onSaveSprintTask,
  onImproveSkill,
}: LearningSprintPanelProps) {
  const canImprove = Boolean(
    sprint &&
      sprint.status !== "completed" &&
      sprint.tasks.length > 0 &&
      sprint.tasks.every(hasSprintTaskProof),
  );

  return (
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
              onClick={() => onSprintDaysChange(days)}
              type="button"
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {selectedSprintSkill ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-3 py-1.5 text-xs font-semibold text-[#FFD8B0]">
                {selectedSprintSkill.skill}
              </span>
              <span className="text-xs text-[#AEB6C2]">{selectedConfidence} confidence</span>
              {sprint?.status === "completed" ? (
                <span className="stamp rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-[#DDF0DD]">
                  Improved
                </span>
              ) : null}
            </div>
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-xs font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="sprint-create"
              disabled={sprintStatus === "loading" || sprintStatus === "creating" || sprintStatus === "saving"}
              onClick={onCreateSprint}
              type="button"
            >
              <BookOpenCheck size={14} strokeWidth={1.9} />
              {sprint ? "Regenerate plan" : `Create ${sprintDays}-day sprint`}
            </button>
          </div>

          {sprintMessage ? (
            <p
              className={`mb-3 rounded-[14px] border px-3 py-2 text-sm leading-6 ${
                sprintStatus === "error"
                  ? "border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]"
                  : "border-[#5C7A5C]/40 bg-[#5C7A5C]/12 text-[#DDF0DD]"
              }`}
            >
              {sprintMessage}
            </p>
          ) : null}

          {sprintStatus === "loading" ? (
            <div className="rounded-[16px] border border-white/10 bg-[#303849]/70 px-4 py-5 text-sm text-[#AEB6C2]">
              Loading your saved sprint...
            </div>
          ) : sprint ? (
            <div className="space-y-3">
              <p className="text-xs leading-5 text-[#AEB6C2]">
                Add a proof link or note for each task. A skill cannot be improved until every task has proof.
              </p>
              {sprint.tasks.map((task) => (
                <div
                  className="rounded-[16px] border border-white/10 bg-[#303849]/70 p-3"
                  data-testid={`sprint-task-${task.task_order}`}
                  key={task.id}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/14 bg-[#171A1F] font-mono text-xs text-white/82">
                      {task.task_order}
                    </span>
                    <p className="text-sm leading-6 text-white/82">{task.title}</p>
                    {task.completed ? (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-[#DDF0DD]">Proof added</span>
                    ) : null}
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="block">
                      <span className="mb-1 block text-[0.68rem] uppercase tracking-[0.1em] text-[#AEB6C2]">Proof link</span>
                      <input
                        className="dashboard-input min-h-0 w-full py-2 text-xs"
                        data-testid={`sprint-proof-url-${task.task_order}`}
                        onChange={(event) => onUpdateSprintTask(task.id, { proof_url: event.target.value })}
                        placeholder="GitHub, deployment, screenshot..."
                        value={task.proof_url ?? ""}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[0.68rem] uppercase tracking-[0.1em] text-[#AEB6C2]">Proof note</span>
                      <input
                        className="dashboard-input min-h-0 w-full py-2 text-xs"
                        data-testid={`sprint-proof-note-${task.task_order}`}
                        onChange={(event) => onUpdateSprintTask(task.id, { proof_note: event.target.value })}
                        placeholder="What did you prove?"
                        value={task.proof_note ?? ""}
                      />
                    </label>
                    <button
                      className="min-h-10 rounded-xl border border-[#9BB99B]/45 bg-[#5C7A5C]/14 px-3 text-xs font-semibold text-[#DDF0DD] transition hover:border-[#9BB99B]/70 hover:bg-[#5C7A5C]/24 disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid={`sprint-save-task-${task.task_order}`}
                      disabled={sprintStatus === "saving"}
                      onClick={() => onSaveSprintTask(task)}
                      type="button"
                    >
                      {sprintStatus === "saving" ? "Saving..." : "Save proof"}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#C77D2E]/35 bg-[#C77D2E]/10 px-3 py-3">
                <p className="text-xs leading-5 text-[#FFD8B0]">
                  Skill improvement requires one proof item per task. Notes alone do not make a CV claim ready.
                </p>
                <button
                  className="min-h-10 rounded-xl bg-[#2C7BE5] px-4 text-xs font-semibold text-white transition hover:bg-[#3B88F1] disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="sprint-improve-skill"
                  disabled={sprintStatus === "saving" || !canImprove}
                  onClick={onImproveSkill}
                  type="button"
                >
                  {sprint.status === "completed" ? "Skill improved" : "Improve skill"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-white/14 bg-[#303849]/45 px-4 py-5 text-sm leading-6 text-[#AEB6C2]">
              Create a {sprintDays}-day sprint for {selectedSprintSkill.skill}. The plan will be saved to your account so you can return with proof.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#5C7A5C]/40 bg-[#5C7A5C]/14 px-4 py-3 text-sm text-[#DDF0DD]">
          Every mapped skill has enough evidence for now. Keep proof links fresh before using them in applications.
        </div>
      )}
    </div>
  );
}
