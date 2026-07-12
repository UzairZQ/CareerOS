"use client";

import { CalendarDays, Plus, Stamp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import {
  formatValidationError,
  workHourLogSchema,
} from "@/lib/dashboard-validation";
import { createClient } from "@/lib/supabase/browser";
import { calculateWorkHourStats, getIsoWeekRange, type WorkHourLog } from "@/lib/work-hours";

type WorkHoursPermitProps = {
  logs: WorkHourLog[];
  tableReady?: boolean;
  userId: string;
};

const statusCopy = {
  compliant: "Compliant",
  warning: "Near limit",
  "over-limit": "Over limit",
};

const statusClass = {
  compliant: "text-[#DDF0DD] border-[#DDF0DD]",
  warning: "text-[#FFE1B8] border-[#FFE1B8]",
  "over-limit": "text-[#FFD8B0] border-[#FFD8B0]",
};

export function WorkHoursPermit({ logs, tableReady = true, userId }: WorkHoursPermitProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stats = useMemo(() => calculateWorkHourStats(logs), [logs]);
  const week = getIsoWeekRange();
  const recentLogs = logs.slice(0, 4);
  const weeklyPercent = Math.min(100, (stats.weeklyHours / stats.weeklyLimit) * 100);
  const yearlyPercent = Math.min(100, (stats.yearlyFullDays / stats.yearlyFullDayLimit) * 100);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsedLog = workHourLogSchema.safeParse({
      day_type: String(formData.get("day_type") ?? "full"),
      employer: String(formData.get("employer") ?? ""),
      hours: String(formData.get("hours") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      user_id: userId,
      work_date: String(formData.get("work_date") ?? ""),
    });

    if (!parsedLog.success) {
      setError(formatValidationError(parsedLog.error));
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("work_hour_logs").insert(parsedLog.data);

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    form.reset();
    setIsSaving(false);
    setIsOpen(false);
    router.refresh();
  }

  async function deleteLog(id: string) {
    setDeletingId(id);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("work_hour_logs").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  return (
    <article className="dashboard-card-permit relative overflow-hidden rounded-[22px] p-5 shadow-soft-blue">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-4 flex items-center gap-4 text-xs uppercase tracking-wide text-white/80">
            <span>Work hour permit</span>
            <span className="h-px w-16 bg-white/55" />
            <span>
              {week.start.slice(5)} - {week.end.slice(5)}
            </span>
          </div>
          <h2 className="mb-2 font-serif text-[clamp(2rem,3.2vw,3.4rem)] font-normal leading-[0.95] tracking-[-0.01em]">
            {stats.weeklyHours} / {stats.weeklyLimit} hrs
          </h2>
          <p className="text-base text-white/78">Student work allowance</p>
        </div>

        <span
          className={`stamp rounded-full px-4 py-2 text-xs font-semibold uppercase ${statusClass[stats.status]}`}
        >
          {statusCopy[stats.status]}
        </span>
      </div>

      {!tableReady && (
        <div className="mb-4 rounded-[18px] border border-white/25 bg-black/12 px-4 py-3 text-sm leading-6 text-white/86">
          Work-hour saving is waiting for the latest Supabase schema. Run the updated{" "}
          <code className="rounded bg-black/20 px-1.5 py-1">supabase/schema.sql</code>.
        </div>
      )}

      <div className="mb-4 space-y-3">
        <PermitMeter label="Weekly hours" percent={weeklyPercent} value={`${stats.weeklyHours} / ${stats.weeklyLimit}`} />
        <PermitMeter label="Full days this year" percent={yearlyPercent} value={`${stats.yearlyFullDays} / ${stats.yearlyFullDayLimit}`} />
        <PermitMeter
          label="Half days this year"
          percent={Math.min(100, (stats.yearlyHalfDays / stats.yearlyHalfDayLimit) * 100)}
          value={`${stats.yearlyHalfDays} / ${stats.yearlyHalfDayLimit}`}
        />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {recentLogs.length > 0 ? (
          recentLogs.map((log) => (
            <div
              className="rounded-[18px] border border-white/16 bg-white/10 p-3 backdrop-blur"
              key={log.id}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-white/72">{log.work_date}</span>
                <button
                  aria-label={`Delete work log from ${log.work_date}`}
                  className="grid h-7 w-7 place-items-center rounded-lg text-white/66 transition hover:bg-white/12 hover:text-white disabled:opacity-40"
                  disabled={deletingId === log.id}
                  onClick={() => deleteLog(log.id)}
                  type="button"
                >
                  <Trash2 size={14} strokeWidth={1.9} />
                </button>
              </div>
              <p className="font-serif text-2xl leading-none">{Number(log.hours)}h</p>
              <p className="mt-1 truncate text-xs text-white/68">
                {log.employer || "Employer not set"} · {log.day_type}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-white/16 bg-white/10 p-4 text-sm leading-6 text-white/74 md:col-span-3">
            No hours logged yet. Add your first entry to make this permit card real.
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-[16px] border border-[#FFD8B0]/40 bg-black/16 px-4 py-3 text-sm text-[#FFD8B0]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/78">
          <Stamp size={17} strokeWidth={1.8} />
          Proof-style log for §16b planning, not legal advice.
        </div>
        <button
          className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#171A1F] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!tableReady}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <Plus size={17} strokeWidth={1.8} />
          {isOpen ? "Close log" : "Log hours"}
        </button>
      </div>

      {isOpen && (
        <form className="mt-4 grid gap-3 rounded-[20px] border border-white/14 bg-black/14 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/84">
              <CalendarDays size={15} strokeWidth={1.9} />
              Date
            </span>
            <input className="dashboard-input w-full" name="work_date" required type="date" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/84">Employer</span>
            <input className="dashboard-input w-full" name="employer" placeholder="Company or mini-job" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/84">Hours</span>
            <input
              className="dashboard-input w-full"
              max="24"
              min="0.25"
              name="hours"
              required
              step="0.25"
              type="number"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/84">Allowance day type</span>
            <select className="dashboard-input w-full" defaultValue="full" name="day_type">
              <option value="full">Full day</option>
              <option value="half">Half day</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-white/84">Notes</span>
            <input className="dashboard-input w-full" name="notes" placeholder="Shift, contract note, timesheet reference..." />
          </label>
          <div className="flex justify-end md:col-span-2">
            <button
              className="rounded-xl bg-[#171A1F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#262B34] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save log"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function PermitMeter({ label, percent, value }: { label: string; percent: number; value: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-white/72">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/18">
        <div
          className="h-full rounded-full bg-white/86"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
