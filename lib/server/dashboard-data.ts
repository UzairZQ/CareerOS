import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { calculateDashboardAnalytics } from "@/lib/dashboard-analytics";
import type { AiProvider } from "@/lib/ai-providers";
import type { UserProfileData } from "@/lib/user-profile";
import { getYearRange, type WorkHourLog } from "@/lib/work-hours";
import { createAdminClient } from "@/lib/supabase/admin";

export type ApplicationRecord = {
  applied_date: string | null;
  id: string;
  company: string;
  role: string;
  source: string | null;
  location: string | null;
  url: string | null;
  status: "saved" | "applied" | "interview" | "rejected" | "offer";
  follow_up_date: string | null;
  job_description: string | null;
  notes: string | null;
  created_at: string;
};

export type EvidenceRecord = {
  application_id: string | null;
  skill: string;
  evidence_summary: string | null;
  confidence: "direct" | "bridge" | "basic" | "learning" | "missing";
  proof_url: string | null;
};

export type AiProviderSettingRecord = {
  provider: AiProvider;
  key_hint: string | null;
  enabled: boolean;
};

export type DashboardData = {
  userProfile: UserProfileData | null;
  userProfileError: PostgrestError | null;
  storedApplications: ApplicationRecord[];
  applicationsError: PostgrestError | null;
  storedEvidence: EvidenceRecord[];
  evidenceError: PostgrestError | null;
  workHourLogs: WorkHourLog[];
  workHourLogsError: PostgrestError | null;
  aiProviderSettings: AiProviderSettingRecord[];
  aiProviderSettingsError: PostgrestError | null;
  analytics: ReturnType<typeof calculateDashboardAnalytics>;
};

export async function loadDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardData> {
  // These queries do not depend on one another, so fetch them together.
  const admin = createAdminClient();
  const [profileResult, applicationsResult, workHoursResult, aiSettingsResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("full_name, current_city, work_authorization, languages, target_roles, profile_note, cv_text")
      .eq("user_id", userId)
      .maybeSingle<UserProfileData>(),
    supabase
      .from("applications")
      .select("id, company, role, location, url, status, applied_date, follow_up_date, job_description, notes, source, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<ApplicationRecord[]>(),
    supabase
      .from("work_hour_logs")
      .select("id, work_date, employer, hours, day_type, notes")
      .eq("user_id", userId)
      .gte("work_date", getYearRange().start)
      .lte("work_date", getYearRange().end)
      .order("work_date", { ascending: false })
      .returns<WorkHourLog[]>(),
    admin
      .from("ai_provider_settings")
      .select("provider, key_hint, enabled")
      .eq("user_id", userId)
      .eq("enabled", true)
      .returns<AiProviderSettingRecord[]>(),
  ]);

  const storedApplications = applicationsResult.data ?? [];
  const applicationIds = storedApplications.map((application) => application.id);
  let storedEvidence: EvidenceRecord[] = [];
  let evidenceError: PostgrestError | null = null;

  if (applicationIds.length > 0) {
    const evidenceResult = await supabase
      .from("evidence_items")
      .select("application_id, skill, evidence_summary, confidence, proof_url")
      .eq("user_id", userId)
      .in("application_id", applicationIds)
      .returns<EvidenceRecord[]>();
    storedEvidence = evidenceResult.data ?? [];
    evidenceError = evidenceResult.error;
  }

  return {
    userProfile: profileResult.data,
    userProfileError: profileResult.error,
    storedApplications,
    applicationsError: applicationsResult.error,
    storedEvidence,
    evidenceError,
    workHourLogs: workHoursResult.data ?? [],
    workHourLogsError: workHoursResult.error,
    aiProviderSettings: aiSettingsResult.data ?? [],
    aiProviderSettingsError: aiSettingsResult.error,
    analytics: calculateDashboardAnalytics({
      applications: storedApplications,
      evidence: storedEvidence,
    }),
  };
}
