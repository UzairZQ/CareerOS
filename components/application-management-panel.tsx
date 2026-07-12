"use client";

import { ExternalLink, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatZodError,
  updateApplicationRecordSchema,
  updateApplicationSchema,
  type UpdateApplicationRecordInput,
} from "@/lib/application-validation";
import { createClient } from "@/lib/supabase/browser";
import {
  ApplicationRecordEditor,
  type ApplicationRecordSaveState,
} from "@/components/application-record-editor";

export type ManagedApplication = {
  applied_date: string | null;
  id: string;
  company: string;
  job_description: string | null;
  role: string;
  source: string | null;
  location: string | null;
  url: string | null;
  status: "saved" | "applied" | "interview" | "rejected" | "offer";
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
};

const statusOptions: Array<ManagedApplication["status"]> = [
  "saved",
  "applied",
  "interview",
  "rejected",
  "offer",
];

const statusLabels: Record<ManagedApplication["status"], string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  saved: "Saved",
};

const statusClasses: Record<ManagedApplication["status"], string> = {
  applied: "border-[#2C7BE5]/45 bg-[#2C7BE5]/12 text-[#D8E8FF]",
  interview: "border-[#5C7A5C]/45 bg-[#5C7A5C]/14 text-[#DDF0DD]",
  offer: "border-[#5C7A5C]/60 bg-[#5C7A5C]/20 text-[#DDF0DD]",
  rejected: "border-[#C77D2E]/48 bg-[#C77D2E]/12 text-[#FFD8B0]",
  saved: "border-white/14 bg-white/[0.07] text-white/72",
};

type DraftValue = {
  follow_up_date: string;
  notes: string;
  status: ManagedApplication["status"];
};

type DraftOverrides = Record<string, Partial<DraftValue>>;

type SaveState = "idle" | "saving" | "saved" | "error";

export function ApplicationManagementPanel({
  applications,
  tableReady = true,
}: {
  applications: ManagedApplication[];
  tableReady?: boolean;
}) {
  const router = useRouter();
  const [draftOverrides, setDraftOverrides] = useState<DraftOverrides>({});
  const [saveStateById, setSaveStateById] = useState<Record<string, SaveState>>({});
  const [recordSaveStateById, setRecordSaveStateById] = useState<
    Record<string, ApplicationRecordSaveState>
  >({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string | null>>({});
  const [recordErrorById, setRecordErrorById] = useState<Record<string, string | null>>({});
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ManagedApplication["status"] | "all">("all");
  const [query, setQuery] = useState("");

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const draft = getApplicationDraft(application, draftOverrides);
      const matchesStatus = statusFilter === "all" || draft.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          application.company,
          application.role,
          application.location,
          application.job_description,
          draft.notes,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [applications, draftOverrides, query, statusFilter]);

  function updateDraft(
    application: ManagedApplication,
    updates: Partial<DraftValue>,
  ) {
    setDraftOverrides((current) => ({
      ...current,
      [application.id]: {
        ...(current[application.id] ?? {}),
        ...updates,
      },
    }));
    setSaveStateById((current) => ({ ...current, [application.id]: "idle" }));
    setErrorById((current) => ({ ...current, [application.id]: null }));
  }

  async function saveApplication(application: ManagedApplication) {
    const draft = getApplicationDraft(application, draftOverrides);
    const parsed = updateApplicationSchema.safeParse(draft);

    if (!parsed.success) {
      setSaveStateById((current) => ({ ...current, [application.id]: "error" }));
      setErrorById((current) => ({
        ...current,
        [application.id]: formatZodError(parsed.error),
      }));
      return;
    }

    const supabase = createClient();

    setSaveStateById((current) => ({ ...current, [application.id]: "saving" }));
    setErrorById((current) => ({ ...current, [application.id]: null }));

    const { error } = await supabase
      .from("applications")
      .update({
        follow_up_date: parsed.data.follow_up_date,
        notes: parsed.data.notes,
        status: parsed.data.status,
      })
      .eq("id", application.id);

    if (error) {
      setSaveStateById((current) => ({ ...current, [application.id]: "error" }));
      setErrorById((current) => ({ ...current, [application.id]: error.message }));
      return;
    }

    setSaveStateById((current) => ({ ...current, [application.id]: "saved" }));
    router.refresh();
  }

  async function saveApplicationRecord(
    application: ManagedApplication,
    details: UpdateApplicationRecordInput,
  ) {
    const parsed = updateApplicationRecordSchema.safeParse(details);

    if (!parsed.success) {
      setRecordSaveStateById((current) => ({ ...current, [application.id]: "error" }));
      setRecordErrorById((current) => ({
        ...current,
        [application.id]: formatZodError(parsed.error),
      }));
      return;
    }

    const supabase = createClient();
    setRecordSaveStateById((current) => ({ ...current, [application.id]: "saving" }));
    setRecordErrorById((current) => ({ ...current, [application.id]: null }));

    const { error } = await supabase
      .from("applications")
      .update({
        applied_date: parsed.data.applied_date,
        company: parsed.data.company,
        job_description: parsed.data.job_description,
        location: parsed.data.location,
        role: parsed.data.role,
        source: parsed.data.source,
        url: parsed.data.url,
      })
      .eq("id", application.id);

    if (error) {
      setRecordSaveStateById((current) => ({ ...current, [application.id]: "error" }));
      setRecordErrorById((current) => ({ ...current, [application.id]: error.message }));
      return;
    }

    setRecordSaveStateById((current) => ({ ...current, [application.id]: "saved" }));
    router.refresh();
  }

  async function deleteApplication(application: ManagedApplication) {
    if (deleteCandidateId !== application.id) {
      setDeleteCandidateId(application.id);
      setErrorById((current) => ({
        ...current,
        [application.id]: "Click delete again to permanently remove this application.",
      }));
      return;
    }

    const supabase = createClient();
    setDeletingId(application.id);
    setErrorById((current) => ({ ...current, [application.id]: null }));

    const { error } = await supabase.from("applications").delete().eq("id", application.id);

    if (error) {
      setDeletingId(null);
      setErrorById((current) => ({ ...current, [application.id]: error.message }));
      return;
    }

    router.refresh();
  }

  return (
    <section className="mb-5 rounded-[22px] border border-white/10 bg-[#252B36] p-4 shadow-dashboard-card md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
            Application desk
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
            Follow-ups, status, notes
          </h2>
        </div>
        <span className="rounded-full border border-white/12 bg-[#171A1F]/58 px-4 py-2 font-mono text-xs text-white/72">
          {applications.length} record{applications.length === 1 ? "" : "s"}
        </span>
      </div>

      {!tableReady && (
        <div className="mb-4 rounded-[18px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
          Application updates are waiting for the Supabase schema.
        </div>
      )}

      {applications.length > 0 && (
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
              Search records
            </span>
            <input
              className="dashboard-input min-h-0 w-full py-2 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Company, role, city, note..."
              value={query}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
              Status filter
            </span>
            <select
              className="dashboard-input min-h-0 w-full py-2 text-sm"
              onChange={(event) =>
                setStatusFilter(event.target.value as ManagedApplication["status"] | "all")
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 px-4 py-7 text-center text-sm leading-6 text-[#AEB6C2]">
          Add your first job above. Once saved, it appears here for status changes,
          follow-up planning, and notes.
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 px-4 py-7 text-center text-sm leading-6 text-[#AEB6C2]">
          No applications match this filter.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredApplications.map((application) => {
            const draft = getApplicationDraft(application, draftOverrides);
            const state = saveStateById[application.id] ?? "idle";
            const error = errorById[application.id];
            const recordSaveState = recordSaveStateById[application.id] ?? "idle";
            const recordError = recordErrorById[application.id];

            return (
              <article
                className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4"
                data-testid={`application-card-${application.id}`}
                key={application.id}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-2xl font-normal leading-none tracking-[-0.01em]">
                        {application.company}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase ${statusClasses[draft.status]}`}
                      >
                        {statusLabels[draft.status]}
                      </span>
                    </div>
                    <p className="text-sm leading-5 text-white/72">
                      {application.role} · {application.location || "Location not set"}
                    </p>
                  </div>

                  {application.url && (
                    <a
                      className="flex min-h-10 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-xs font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/[0.09]"
                      href={application.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink size={14} strokeWidth={1.9} />
                      Job URL
                    </a>
                  )}
                </div>

                <div className="grid gap-3 lg:grid-cols-[0.9fr_0.75fr_1.35fr_auto]">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
                      Status
                    </span>
                    <select
                      className="dashboard-input min-h-0 w-full py-2 text-sm"
                      data-testid={`application-status-${application.id}`}
                      disabled={!tableReady}
                      onChange={(event) =>
                        updateDraft(application, {
                          status: event.target.value as ManagedApplication["status"],
                        })
                      }
                      value={draft.status}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
                      Follow-up
                    </span>
                    <input
                      className="dashboard-input min-h-0 w-full py-2 text-sm"
                      data-testid={`application-follow-up-${application.id}`}
                      disabled={!tableReady}
                      onChange={(event) =>
                        updateDraft(application, { follow_up_date: event.target.value })
                      }
                      type="date"
                      value={draft.follow_up_date}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#AEB6C2]">
                      Notes
                    </span>
                    <input
                      className="dashboard-input min-h-0 w-full py-2 text-sm"
                      data-testid={`application-notes-${application.id}`}
                      disabled={!tableReady}
                      onChange={(event) => updateDraft(application, { notes: event.target.value })}
                      placeholder="Recruiter, next step, application angle..."
                      value={draft.notes}
                    />
                  </label>

                  <div className="flex items-end gap-2">
                    <button
                      className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-white/76 transition hover:border-white/24 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-45"
                      data-testid={`application-save-${application.id}`}
                      disabled={!tableReady || state === "saving"}
                      onClick={() => saveApplication(application)}
                      title="Save application changes"
                      type="button"
                    >
                      <Save size={16} strokeWidth={1.9} />
                    </button>
                    <button
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[#C77D2E]/35 bg-[#C77D2E]/10 text-[#FFD8B0] transition hover:bg-[#C77D2E]/16 disabled:cursor-not-allowed disabled:opacity-45"
                      data-testid={`application-delete-${application.id}`}
                      disabled={deletingId === application.id}
                      onClick={() => deleteApplication(application)}
                      title={
                        deleteCandidateId === application.id
                          ? "Confirm delete"
                          : "Delete application"
                      }
                      type="button"
                    >
                      <Trash2 size={16} strokeWidth={1.9} />
                    </button>
                  </div>
                </div>

                {(state === "saved" || state === "error" || error) && (
                  <p
                    className={`mt-3 rounded-[14px] border px-3 py-2 text-xs ${
                      state === "error" || error
                        ? "border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]"
                        : "border-[#5C7A5C]/40 bg-[#5C7A5C]/12 text-[#DDF0DD]"
                    }`}
                  >
                    {error || "Application updated."}
                  </p>
                )}

                <ApplicationRecordEditor
                  application={application}
                  error={recordError}
                  key={application.id}
                  onSave={(details) => saveApplicationRecord(application, details)}
                  saveState={recordSaveState}
                  tableReady={tableReady}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getApplicationDraft(
  application: ManagedApplication,
  overrides: DraftOverrides,
): DraftValue {
  return {
    follow_up_date: application.follow_up_date ?? "",
    notes: application.notes ?? "",
    status: application.status,
    ...overrides[application.id],
  };
}
