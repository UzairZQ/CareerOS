import { Bell, HelpCircle, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { AddApplicationForm } from "@/components/add-application-form";
import { AiSettingsPanel } from "@/components/ai-settings-panel";
import {
  ApplicationManagementPanel,
  type ManagedApplication,
} from "@/components/application-management-panel";
import { ApplicationAssistantPanel } from "@/components/application-assistant-panel";
import { CareerOSWordmark } from "@/components/careeros-wordmark";
import { CvCheckPanel } from "@/components/cv-check-panel";
import { DashboardAnalyticsPanel } from "@/components/dashboard-analytics-panel";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { JdEvidenceWorkspace } from "@/components/jd-evidence-workspace";
import { ProfileSettingsPanel } from "@/components/profile-settings-panel";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkHoursPermit } from "@/components/work-hours-permit";
import { loadDashboardData } from "@/lib/server/dashboard-data";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileReadiness, type UserProfileData } from "@/lib/user-profile";

type DashboardApplicationCard = {
  id: string;
  company: string;
  role: string;
  location: string;
  meta: string;
  status: string;
  dot: string;
  image: string;
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
    <main className="h-[100dvh] overflow-hidden bg-[#171A1F] text-[#F7F8F6]">
      <section className="dashboard-frame grid h-full overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col bg-[#262B34] px-5 py-8 lg:flex">
          <div className="mb-8 px-3 text-white">
            <CareerOSWordmark />
          </div>

          <div className="mb-7 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-[#D9DEE8] text-base font-semibold text-[#171A1F]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-serif text-lg font-normal tracking-[-0.01em]">
                  {fullName}
                </p>
                <p className="truncate text-xs text-white/52">
                  {targetRole}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#171A1F] px-3 py-2">
              <span className="text-xs text-white/56">Profile readiness</span>
              <span className="font-serif text-xl leading-none text-white">
                {profileReadiness}%
              </span>
            </div>
          </div>

          <DashboardNavigation variant="desktop" />

          <SignOutButton />
        </aside>

        <section className="min-h-0 min-w-0 overflow-y-auto bg-[#171A1F] px-6 py-4 md:px-8 lg:px-9 lg:py-5">
          <header className="mb-4 flex items-center justify-between gap-6">
            <a
              className="flex h-12 w-full max-w-[430px] items-center gap-3 rounded-xl border border-white/10 bg-[#222833] px-5 text-[#AEB6C2] transition hover:border-white/20 hover:text-white"
              href="#applications"
              title="Search applications"
            >
              <Search size={21} strokeWidth={1.7} />
              <span className="text-base">Search applications</span>
            </a>

            <div className="hidden items-center gap-5 text-white/82 md:flex">
              <Bell size={23} strokeWidth={1.7} />
              <HelpCircle size={25} strokeWidth={1.7} />
            </div>
          </header>

          <DashboardNavigation variant="mobile" />

          <section
            className="dashboard-card-tint dashboard-card-blue mb-5 scroll-mt-5 rounded-[20px] p-4 shadow-dashboard-card md:p-5"
            id="overview"
          >
            <div className="mb-3 flex items-center justify-between">
              <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-none tracking-[-0.01em]">
                CareerOS Control
              </h1>
              <a
                className="hidden items-center gap-2 rounded-xl px-4 py-3 text-lg font-medium text-white/85 transition hover:bg-white/5 md:flex"
                href="#analytics"
              >
                Details <span className="text-2xl leading-none">›</span>
              </a>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_0.56fr_0.56fr]">
              <div id="work-hours" className="scroll-mt-5">
                <WorkHoursPermit
                  logs={workHourLogs ?? []}
                  tableReady={!workHourLogsError}
                  userId={user.id}
                />
              </div>

              <MiniStatusCard
                label="Next follow-up"
                title={analytics.nextFollowUpLabel}
                tone="clay"
                value={analytics.nextFollowUpCompany}
              />
              <MiniStatusCard
                label="Response rate"
                title={`${analytics.responseRate}%`}
                tone="sage"
                value={`${analytics.totalApplications} applications`}
              />
            </div>
          </section>

          <section className="scroll-mt-5" id="activity">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-[clamp(1.7rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
                Applications in motion
              </h2>
              <a
                aria-label="Filter applications"
                className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#252B36] text-white/85 transition hover:bg-[#303849]"
                href="#applications"
                title="Open application filters"
              >
                <SlidersHorizontal size={22} strokeWidth={1.8} />
              </a>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.25fr]">
              {dashboardApplications.length > 0 ? (
                dashboardApplications
                  .slice(0, 2)
                  .map((application) => (
                    <ApplicationCard application={application} key={application.id} />
                  ))
              ) : (
                <EmptyApplicationsCard />
              )}

              <article className="dashboard-card-tint dashboard-card-plum rounded-[22px] p-4">
                <p className="mb-3 text-center text-lg font-medium text-white/90">
                  Skill gap grade
                </p>
                <div className="mb-3 text-center text-5xl font-light tracking-[-0.05em] text-[#2C7BE5]">
                  {analytics.skillGapGrade}
                </div>

                <div className="relative mx-auto mb-3 h-16 max-w-[280px]">
                  <svg
                    aria-hidden="true"
                    className="h-full w-full overflow-visible"
                    viewBox="0 0 320 120"
                  >
                    <path
                      d="M8 102 C46 8 62 105 99 61 S153 24 179 56 220 80 244 47 280 10 310 36"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeLinecap="round"
                      strokeWidth="5"
                    />
                    <path
                      d="M8 102 C51 44 72 91 102 70 S148 41 176 53 209 80 238 63 276 18 310 36"
                      fill="none"
                      stroke="url(#gapGradient)"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                    <defs>
                      <linearGradient id="gapGradient" x1="0" x2="1" y1="0" y2="0">
                        <stop stopColor="#545BFF" />
                        <stop offset="0.55" stopColor="#EC43A3" />
                        <stop offset="1" stopColor="#FF6858" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex flex-wrap justify-center gap-3 text-sm text-[#AEB6C2]">
                  {(analytics.mostMissingSkills.length > 0
                    ? analytics.mostMissingSkills.slice(0, 2)
                    : analytics.mostRequestedSkills.slice(0, 2)
                  ).map((item, index) => (
                    <span key={item.skill}>
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          index === 0 ? "bg-[#EC43A3]" : "bg-white/80"
                        }`}
                      />
                      {item.skill}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <div className="scroll-mt-5" id="analytics">
            <DashboardAnalyticsPanel analytics={analytics} />
          </div>

          <section className="scroll-mt-5" id="applications">
            <AddApplicationForm userId={user.id} />

            <ApplicationManagementPanel
              applications={(storedApplications ?? []).map(
                (application): ManagedApplication => ({
                  id: application.id,
                  applied_date: application.applied_date,
                  company: application.company,
                  created_at: application.created_at,
                  follow_up_date: application.follow_up_date,
                  job_description: application.job_description,
                  location: application.location,
                  notes: application.notes,
                  role: application.role,
                  source: application.source,
                  status: application.status,
                  url: application.url,
                }),
              )}
              tableReady={!applicationsError}
            />

            {applicationsError && (
              <div className="mb-5 rounded-[22px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
                Supabase table is not ready yet. Run{" "}
                <code className="rounded bg-black/20 px-1.5 py-1">supabase/schema.sql</code>{" "}
                in the Supabase SQL editor to enable saved applications.
              </div>
            )}
          </section>

          <section className="scroll-mt-5" id="skill-gap">
            <JdEvidenceWorkspace
              aiSettings={aiProviderSettings ?? []}
              applications={(storedApplications ?? []).map((application) => ({
                id: application.id,
                company: application.company,
                role: application.role,
                job_description: application.job_description,
              }))}
              evidenceTableReady={!evidenceError}
              initialEvidence={storedEvidence ?? []}
              userId={user.id}
            />
          </section>

          <section className="scroll-mt-5" id="cv-check">
            <CvCheckPanel
              aiSettings={aiProviderSettings ?? []}
              applications={(storedApplications ?? []).map((application) => ({
                id: application.id,
                company: application.company,
                role: application.role,
                job_description: application.job_description,
              }))}
              initialCvText={profile.cv_text}
              userId={user.id}
            />
          </section>

          <section className="scroll-mt-5" id="assistant">
            <ApplicationAssistantPanel
              applications={(storedApplications ?? []).map((application) => ({
                id: application.id,
                company: application.company,
                role: application.role,
                job_description: application.job_description,
              }))}
              evidence={(storedEvidence ?? []).map((item) => ({
                application_id: item.application_id,
                skill: item.skill,
                evidence_summary: item.evidence_summary,
                confidence: item.confidence,
                proof_url: item.proof_url,
              }))}
            />
          </section>

          <section className="scroll-mt-5" id="profile">
            <ProfileSettingsPanel
              initialProfile={profile}
              tableReady={!userProfileError}
              userId={user.id}
            />
          </section>

          <section className="scroll-mt-5" id="ai-insights">
            <AiSettingsPanel
              initialSettings={aiProviderSettings ?? []}
              tableReady={!aiProviderSettingsError}
            />
          </section>
        </section>

      </section>
    </main>
  );
}

function MiniStatusCard({
  label,
  title,
  tone,
  value,
}: {
  label: string;
  title: string;
  tone: "clay" | "sage";
  value: string;
}) {
  return (
    <article className={`dashboard-card-tint dashboard-card-${tone} h-full rounded-[22px] p-5`}>
      <div className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/75">
        <ShieldCheck size={21} strokeWidth={1.8} />
      </div>
      <p className="mb-2 text-xl font-medium tracking-[-0.02em]">{title}</p>
      <p className="text-sm leading-5 text-[#AEB6C2]">{label}</p>
      <p className="text-sm leading-5 text-[#AEB6C2]">{value}</p>
    </article>
  );
}

function ApplicationCard({
  application,
}: {
  application: DashboardApplicationCard;
}) {
  return (
    <article
      className={`dashboard-card-tint overflow-hidden rounded-[22px] shadow-dashboard-card ${
        application.status === "interview" || application.status === "offer"
          ? "dashboard-card-sage"
          : application.status === "rejected"
            ? "dashboard-card-clay"
            : "dashboard-card-blue"
      }`}
    >
      <div
        className="h-20 p-4"
        style={{ background: application.image }}
      >
        <span className="rounded-lg border border-white/15 bg-[#202733]/90 px-3 py-1.5 text-sm font-medium text-white">
          {application.company}
        </span>
      </div>
      <div className="p-4">
        <p className="mb-2 text-base text-[#C9D4E2]">{application.role}</p>
        <h3 className="mb-3 font-serif text-xl font-normal tracking-[-0.01em]">
          {application.location}
        </h3>
        <div className="mb-3 h-px bg-white/12" />
        <div className="flex items-center justify-between text-sm text-[#AEB6C2]">
          <span>{application.meta}</span>
          <span className={`h-3 w-3 rounded-full ${application.dot}`} />
        </div>
      </div>
    </article>
  );
}

function EmptyApplicationsCard() {
  return (
    <article className="dashboard-card-tint dashboard-card-clay flex min-h-[238px] flex-col justify-between rounded-[22px] p-5 xl:col-span-2">
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-[#AEB6C2]">
          No applications yet
        </p>
        <h3 className="font-serif text-3xl font-normal leading-none tracking-[-0.01em]">
          Start with one real job.
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#AEB6C2]">
          Add a job description to unlock the evidence map, fit signals, and follow-up workflow.
        </p>
      </div>
      <a
        className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.09]"
        href="#applications"
      >
        Add your first job <span className="text-lg leading-none">→</span>
      </a>
    </article>
  );
}
