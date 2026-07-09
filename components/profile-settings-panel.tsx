"use client";

import { IdCard, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import {
  formatValidationError,
  parseCommaList,
  profileSchema,
} from "@/lib/dashboard-validation";
import { createClient } from "@/lib/supabase/browser";
import { calculateProfileReadiness, type UserProfileData } from "@/lib/user-profile";

export function ProfileSettingsPanel({
  initialProfile,
  tableReady = true,
  userId,
}: {
  initialProfile: UserProfileData;
  tableReady?: boolean;
  userId: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [currentCity, setCurrentCity] = useState(initialProfile.current_city ?? "");
  const [workAuthorization, setWorkAuthorization] = useState(initialProfile.work_authorization);
  const [languages, setLanguages] = useState(initialProfile.languages.join(", "));
  const [targetRoles, setTargetRoles] = useState(initialProfile.target_roles.join(", "));
  const [profileNote, setProfileNote] = useState(initialProfile.profile_note ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const readiness = useMemo(
    () =>
      calculateProfileReadiness({
        current_city: currentCity,
        full_name: fullName,
        languages: parseCommaList(languages),
        profile_note: profileNote,
        target_roles: parseCommaList(targetRoles),
        cv_text: initialProfile.cv_text,
        work_authorization: workAuthorization,
      }),
    [currentCity, fullName, initialProfile.cv_text, languages, profileNote, targetRoles, workAuthorization],
  );

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    const nextProfile = {
      current_city: currentCity.trim() || null,
      full_name: fullName.trim() || null,
      languages: parseCommaList(languages),
      profile_note: profileNote.trim() || null,
      target_roles: parseCommaList(targetRoles),
      user_id: userId,
      work_authorization: workAuthorization,
    };
    const parsedProfile = profileSchema.safeParse(nextProfile);

    if (!parsedProfile.success) {
      setStatus("error");
      setMessage(formatValidationError(parsedProfile.error));
      return;
    }

    const supabase = createClient();
    const { error: profileError } = await supabase.from("user_profiles").upsert(parsedProfile.data, {
      onConflict: "user_id",
    });

    if (profileError) {
      setStatus("error");
      setMessage(profileError.message);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: nextProfile.full_name,
        target_role: nextProfile.target_roles[0] ?? "",
      },
    });

    if (metadataError) {
      setStatus("error");
      setMessage(metadataError.message);
      return;
    }

    setStatus("saved");
    setMessage("Profile saved.");
    router.refresh();
  }

  return (
    <section className="mt-5 rounded-[22px] border border-white/10 bg-[#252B36] p-4 shadow-dashboard-card md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
            <IdCard size={17} strokeWidth={1.8} />
            User Profile
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
            German-market context
          </h2>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-[#171A1F]/58 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">Readiness</p>
          <p className="font-serif text-3xl leading-none">{readiness}%</p>
        </div>
      </div>

      {!tableReady && (
        <div className="mb-4 rounded-[18px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
          Profile saving is waiting for the latest Supabase schema. Run the updated{" "}
          <code className="rounded bg-black/20 px-1.5 py-1">supabase/schema.sql</code>.
        </div>
      )}

      <form className="grid gap-4 lg:grid-cols-2" onSubmit={saveProfile}>
        <DashboardProfileField
          disabled={!tableReady}
          label="Full name"
          onChange={setFullName}
          testId="profile-full-name"
          value={fullName}
        />
        <DashboardProfileField
          disabled={!tableReady}
          label="Current city"
          onChange={setCurrentCity}
          placeholder="Frankfurt, Berlin..."
          testId="profile-current-city"
          value={currentCity}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/78">Work authorization</span>
          <select
            className="dashboard-input w-full"
            data-testid="profile-work-authorization"
            disabled={!tableReady}
            onChange={(event) => setWorkAuthorization(event.target.value as UserProfileData["work_authorization"])}
            value={workAuthorization}
          >
            <option value="unknown">Not set</option>
            <option value="student_visa">Student visa</option>
            <option value="eu_citizen">EU citizen</option>
            <option value="job_seeker">Job seeker visa</option>
            <option value="work_permit">Work permit</option>
            <option value="other">Other</option>
          </select>
        </label>

        <DashboardProfileField
          disabled={!tableReady}
          label="Languages"
          onChange={setLanguages}
          placeholder="English C1, German B1, Urdu Native"
          testId="profile-languages"
          value={languages}
        />
        <DashboardProfileField
          disabled={!tableReady}
          label="Target roles"
          onChange={setTargetRoles}
          placeholder="Frontend Working Student, Junior Web Developer"
          testId="profile-target-roles"
          value={targetRoles}
        />

        <label className="block lg:col-span-2">
          <span className="mb-2 block text-sm font-medium text-white/78">Profile note</span>
          <textarea
            className="dashboard-input min-h-24 w-full resize-y"
            data-testid="profile-note"
            disabled={!tableReady}
            onChange={(event) => setProfileNote(event.target.value)}
            placeholder="Short positioning note, relocation constraints, weekly availability..."
            value={profileNote}
          />
        </label>

        {message && (
          <p
            className={`rounded-[16px] border px-4 py-3 text-sm lg:col-span-2 ${
              status === "error"
                ? "border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]"
                : "border-[#5C7A5C]/40 bg-[#5C7A5C]/12 text-[#DDF0DD]"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex justify-end lg:col-span-2">
          <button
            className="flex min-h-11 items-center gap-2 rounded-xl bg-[#2C7BE5] px-5 text-sm font-semibold text-white transition hover:bg-[#3B88F1] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="profile-save"
            disabled={!tableReady || status === "saving"}
            type="submit"
          >
            <Save size={16} strokeWidth={1.9} />
            {status === "saving" ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}

function DashboardProfileField({
  disabled = false,
  label,
  onChange,
  placeholder,
  testId,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/78">{label}</span>
      <input
        className="dashboard-input w-full"
        data-testid={testId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
