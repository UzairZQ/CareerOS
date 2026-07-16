import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { loadDashboardData } from "@/lib/server/dashboard-data";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileReadiness, type UserProfileData } from "@/lib/user-profile";

type DashboardApplicationCard = {
  company: string;
  dot: string;
  id: string;
  image: string;
  location: string;
  meta: string;
  role: string;
  status: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const metadataFullName =
    typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name
      ? user.user_metadata.full_name
      : null;
  const metadataTargetRole =
    typeof user.user_metadata.target_role === "string" && user.user_metadata.target_role
      ? user.user_metadata.target_role
      : null;
  const {
    aiProviderSettings,
    aiProviderSettingsError,
    analytics,
    applicationsError,
    evidenceError,
    storedApplications,
    storedEvidence,
    userProfile,
    userProfileError,
    workHourLogs,
    workHourLogsError,
  } = await loadDashboardData(supabase, user.id);

  const profile: UserProfileData = {
    current_city: userProfile?.current_city ?? null,
    full_name: userProfile?.full_name ?? metadataFullName,
    languages: userProfile?.languages ?? [],
    profile_note: userProfile?.profile_note ?? null,
    cv_text: userProfile?.cv_text ?? null,
    target_roles:
      userProfile?.target_roles && userProfile.target_roles.length > 0
        ? userProfile.target_roles
        : metadataTargetRole
          ? [metadataTargetRole]
          : [],
    work_authorization: userProfile?.work_authorization ?? "unknown",
  };
  const fullName = profile.full_name || "CareerOS User";
  const targetRole = profile.target_roles[0] || "International Student";
  const profileReadiness = calculateProfileReadiness(profile);
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dashboardApplications: DashboardApplicationCard[] = storedApplications.map(
    (application) => ({
      id: application.id,
      company: application.company,
      role: application.role,
      location: application.location || "Location not set",
      meta: application.applied_date
        ? `Applied ${application.applied_date}`
        : application.follow_up_date
          ? `Follow up ${application.follow_up_date}`
          : application.status.charAt(0).toUpperCase() + application.status.slice(1),
      status: application.status,
      dot:
        application.status === "interview"
          ? "bg-[#9bb99b]"
          : application.status === "rejected"
            ? "bg-[#C77D2E]"
            : application.status === "offer"
              ? "bg-[#5C7A5C]"
              : "bg-[#C77D2E]",
      image:
        "linear-gradient(135deg, rgba(44,123,229,0.18), rgba(18,23,32,0.95)), radial-gradient(circle at 22% 30%, rgba(255,255,255,0.14), transparent 22%), linear-gradient(45deg, #1d2531 0 25%, #273244 25% 50%, #1d2531 50% 75%, #273244 75%)",
    }),
  );

  return (
    <DashboardShell
      aiProviderSettings={aiProviderSettings ?? []}
      aiSettingsTableReady={!aiProviderSettingsError}
      analytics={analytics}
      applications={storedApplications}
      applicationsTableReady={!applicationsError}
      dashboardApplications={dashboardApplications}
      evidence={storedEvidence}
      evidenceTableReady={!evidenceError}
      fullName={fullName}
      initials={initials}
      profile={profile}
      profileReadiness={profileReadiness}
      profileTableReady={!userProfileError}
      targetRole={targetRole}
      userId={user.id}
      workHourLogs={workHourLogs ?? []}
      workHoursTableReady={!workHourLogsError}
    />
  );
}
