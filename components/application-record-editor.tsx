"use client";

import { ChevronDown, FileText, Pencil, Save } from "lucide-react";
import { useState } from "react";
import type { ManagedApplication } from "@/components/application-management-panel";
import type { UpdateApplicationRecordInput } from "@/lib/application-validation";

export type ApplicationRecordSaveState = "idle" | "saving" | "saved" | "error";

type ApplicationRecordEditorProps = {
  application: ManagedApplication;
  error: string | null;
  saveState: ApplicationRecordSaveState;
  tableReady: boolean;
  onSave: (details: UpdateApplicationRecordInput) => void;
};

export function ApplicationRecordEditor({
  application,
  error,
  onSave,
  saveState,
  tableReady,
}: ApplicationRecordEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<UpdateApplicationRecordInput>(() => getDraft(application));

  function updateDraft(field: keyof UpdateApplicationRecordInput, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <button
        aria-expanded={isOpen}
        className="flex min-h-10 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 text-xs font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
        data-testid={`application-details-toggle-${application.id}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? <ChevronDown size={15} strokeWidth={1.9} /> : <Pencil size={15} strokeWidth={1.9} />}
        {isOpen ? "Close record details" : "Edit record details"}
      </button>

      {isOpen && (
        <div className="mt-4 grid gap-3 rounded-[16px] border border-white/10 bg-[#222833]/64 p-3 md:grid-cols-2">
          <RecordField
            label="Company"
            name="company"
            onChange={(value) => updateDraft("company", value)}
            testId={`application-company-${application.id}`}
            value={draft.company}
          />
          <RecordField
            label="Role"
            name="role"
            onChange={(value) => updateDraft("role", value)}
            testId={`application-role-${application.id}`}
            value={draft.role}
          />
          <RecordField
            label="Location"
            name="location"
            onChange={(value) => updateDraft("location", value)}
            testId={`application-location-${application.id}`}
            value={draft.location ?? ""}
          />
          <RecordField
            label="Job URL"
            name="url"
            onChange={(value) => updateDraft("url", value)}
            testId={`application-url-${application.id}`}
            type="url"
            value={draft.url ?? ""}
          />
          <RecordField
            label="Source"
            name="source"
            onChange={(value) => updateDraft("source", value)}
            testId={`application-source-${application.id}`}
            value={draft.source ?? ""}
          />
          <RecordField
            label="Applied date"
            name="applied_date"
            onChange={(value) => updateDraft("applied_date", value)}
            testId={`application-applied-date-${application.id}`}
            type="date"
            value={draft.applied_date ?? ""}
          />

          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
              <FileText size={14} strokeWidth={1.8} />
              Job description
            </span>
            <textarea
              className="dashboard-input min-h-32 w-full resize-y text-sm"
              data-testid={`application-job-description-${application.id}`}
              disabled={!tableReady || saveState === "saving"}
              onChange={(event) => updateDraft("job_description", event.target.value)}
              placeholder="Paste the source job description so the analyzer can stay grounded."
              value={draft.job_description ?? ""}
            />
          </label>

          {(error || saveState === "saved") && (
            <p
              className={`rounded-[14px] border px-3 py-2 text-xs md:col-span-2 ${
                error
                  ? "border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]"
                  : "border-[#5C7A5C]/40 bg-[#5C7A5C]/12 text-[#DDF0DD]"
              }`}
            >
              {error || "Application record updated."}
            </p>
          )}

          <div className="flex justify-end md:col-span-2">
            <button
              className="flex min-h-10 items-center gap-2 rounded-xl border border-[#2C7BE5]/45 bg-[#2C7BE5]/16 px-4 text-xs font-semibold text-[#D8E8FF] transition hover:border-[#2C7BE5]/70 hover:bg-[#2C7BE5]/24 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid={`application-details-save-${application.id}`}
              disabled={!tableReady || saveState === "saving"}
              onClick={() => onSave(draft)}
              type="button"
            >
              <Save size={15} strokeWidth={1.9} />
              {saveState === "saving" ? "Saving..." : "Save record"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getDraft(application: ManagedApplication): UpdateApplicationRecordInput {
  return {
    applied_date: application.applied_date ?? "",
    company: application.company,
    job_description: application.job_description ?? "",
    location: application.location ?? "",
    role: application.role,
    source: application.source ?? "",
    url: application.url ?? "",
  };
}

function RecordField({
  label,
  name,
  onChange,
  testId,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  testId: string;
  type?: "date" | "text" | "url";
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
        {label}
      </span>
      <input
        className="dashboard-input min-h-0 w-full py-2 text-sm"
        data-testid={testId}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}
