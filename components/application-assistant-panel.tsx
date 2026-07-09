"use client";

import { BadgeCheck, FilePenLine, Lightbulb, ShieldAlert } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import {
  generateApplicationAssistantSuggestions,
  type AssistantEvidenceInput,
} from "@/lib/careeros-analyzer";

type AssistantApplicationOption = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
};

type ApplicationAssistantPanelProps = {
  applications: AssistantApplicationOption[];
  evidence: Array<AssistantEvidenceInput & { application_id: string | null }>;
};

export function ApplicationAssistantPanel({
  applications,
  evidence,
}: ApplicationAssistantPanelProps) {
  const firstApplication = applications.find((application) => application.job_description) ?? applications[0];
  const [selectedApplicationId, setSelectedApplicationId] = useState(firstApplication?.id ?? "manual");
  const selectedApplication = applications.find((application) => application.id === selectedApplicationId);
  const applicationEvidence = evidence.filter(
    (item) => item.application_id && item.application_id === selectedApplicationId,
  );
  const suggestions = useMemo(
    () =>
      generateApplicationAssistantSuggestions({
        company: selectedApplication?.company ?? "Selected company",
        evidence: applicationEvidence,
        jobDescription: selectedApplication?.job_description || "",
        role: selectedApplication?.role ?? "Early-career developer",
      }),
    [applicationEvidence, selectedApplication],
  );

  return (
    <section className="mt-5 rounded-[22px] border border-white/10 bg-[#252B36] p-4 shadow-dashboard-card md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
            <FilePenLine size={17} strokeWidth={1.8} />
            Application Assistant
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
            Tailor without inventing
          </h2>
        </div>
        <span className="stamp rounded-full px-3 py-2 text-[0.67rem] font-semibold uppercase text-[#DDF0DD]">
          Evidence backed
        </span>
      </div>

      <label className="mb-5 block max-w-xl">
        <span className="mb-2 block text-sm font-medium text-white/74">Application context</span>
        <select
          className="dashboard-input w-full"
          onChange={(event) => setSelectedApplicationId(event.target.value)}
          value={selectedApplicationId}
        >
          {applications.length === 0 && <option value="manual">No application selected</option>}
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.company} - {application.role}
            </option>
          ))}
        </select>
      </label>

      {!selectedApplication ? (
        <div className="mb-5 rounded-[18px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
          Add an application with a job description to generate evidence-backed suggestions.
        </div>
      ) : null}

      {selectedApplication ? (
        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <AssistantCard
            icon={<BadgeCheck size={18} strokeWidth={1.9} />}
            label="CV subtitle"
            value={suggestions.subtitle}
          />
          <AssistantCard
            icon={<Lightbulb size={18} strokeWidth={1.9} />}
            label="Profile angle"
            value={suggestions.profileAngle}
          />
          <AssistantCard
            icon={<FilePenLine size={18} strokeWidth={1.9} />}
            label="Cover letter USP"
            value={suggestions.coverLetterUsp}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
              Bullet angles
            </p>
            <ul className="space-y-3 text-sm leading-6 text-white/76">
              {suggestions.bulletAngles.map((angle) => (
                <li className="rounded-[14px] border border-white/10 bg-[#303849]/70 px-3 py-2" key={angle}>
                  {angle}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
              <ShieldAlert size={16} strokeWidth={1.9} />
              Proof warnings
            </p>
            {suggestions.proofWarnings.length > 0 ? (
              <ul className="space-y-2 text-sm leading-6 text-[#FFD8B0]">
                {suggestions.proofWarnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-[#DDF0DD]">
                Current assistant suggestions only use evidence-backed skills.
              </p>
            )}
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
              Skills allowed in claims
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.evidenceBackedSkills.length > 0 ? (
                suggestions.evidenceBackedSkills.map((skill) => (
                  <span
                    className="rounded-full border border-[#5C7A5C]/45 bg-[#5C7A5C]/14 px-3 py-1.5 text-xs font-semibold text-[#DDF0DD]"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#AEB6C2]">No CV-ready skill claims yet</span>
              )}
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-white/14 bg-[#171A1F]/44 px-5 py-10 text-center text-sm leading-6 text-[#AEB6C2]">
          The assistant will show a subtitle, profile angle, bullet angles, and cover-letter USP after you add a real application with its job description.
        </div>
      )}
    </section>
  );
}

function AssistantCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
        {icon}
        {label}
      </p>
      <p className="text-sm leading-6 text-white/78">{value}</p>
    </div>
  );
}
