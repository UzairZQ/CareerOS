"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import {
  createApplicationSchema,
  formatZodError,
} from "@/lib/application-validation";
import { createClient } from "@/lib/supabase/browser";

type AddApplicationFormProps = {
  userId: string;
};

export function AddApplicationForm({ userId }: AddApplicationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = createApplicationSchema.safeParse({
      company: String(formData.get("company") ?? ""),
      follow_up_date: String(formData.get("follow_up_date") ?? ""),
      job_description: String(formData.get("job_description") ?? ""),
      location: String(formData.get("location") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      role: String(formData.get("role") ?? ""),
      status: String(formData.get("status") ?? "saved"),
      url: String(formData.get("url") ?? ""),
    });

    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      setIsSaving(false);
      return;
    }

    const supabase = createClient();

    const { error: insertError } = await supabase.from("applications").insert({
      user_id: userId,
      company: parsed.data.company,
      follow_up_date: parsed.data.follow_up_date,
      job_description: parsed.data.job_description,
      location: parsed.data.location,
      notes: parsed.data.notes,
      role: parsed.data.role,
      status: parsed.data.status,
      url: parsed.data.url,
    });

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

  return (
    <div className="mb-5 rounded-[22px] border border-white/10 bg-[#252B36] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-serif text-2xl font-normal tracking-[-0.01em]">
            Job tracker
          </p>
          <p className="mt-1 text-sm text-[#AEB6C2]">
            Add real applications and keep the evidence workflow grounded.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-2xl bg-[#F7F8F6] px-4 text-sm font-semibold text-[#171A1F] transition hover:bg-[#E9ECE6]"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <Plus size={17} strokeWidth={1.8} />
          {isOpen ? "Close" : "Add job"}
        </button>
      </div>

      {isOpen && (
        <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <DashboardField label="Company" name="company" placeholder="Zalando SE" required />
          <DashboardField
            label="Role"
            name="role"
            placeholder="Frontend Working Student"
            required
          />
          <DashboardField label="Location" name="location" placeholder="Berlin · Hybrid" />
          <DashboardField label="Job URL" name="url" placeholder="https://..." type="url" />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/78">Status</span>
            <select
              className="dashboard-input w-full"
              defaultValue="saved"
              name="status"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
              <option value="offer">Offer</option>
            </select>
          </label>

          <DashboardField label="Follow-up date" name="follow_up_date" type="date" />

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-white/78">
              Job description
            </span>
            <textarea
              className="dashboard-input min-h-28 w-full resize-y"
              name="job_description"
              placeholder="Paste the JD text here. The rule-based analyzer comes next."
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-white/78">Notes</span>
            <textarea
              className="dashboard-input min-h-20 w-full resize-y"
              name="notes"
              placeholder="Recruiter name, application angle, follow-up notes..."
            />
          </label>

          {error && (
            <p className="rounded-2xl border border-[#C77D2E]/50 bg-[#C77D2E]/12 px-4 py-3 text-sm text-[#FFD8B0] lg:col-span-2">
              {error}
            </p>
          )}

          <div className="flex justify-end lg:col-span-2">
            <button
              className="rounded-2xl bg-[#2C7BE5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3B88F1] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save application"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function DashboardField({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/78">{label}</span>
      <input
        className="dashboard-input w-full"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
