"use client";

import { Bell, HelpCircle, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  DashboardNavigation,
  navItems,
  type DashboardModule,
} from "@/components/dashboard-navigation";
import { JdEvidenceWorkspace } from "@/components/jd-evidence-workspace";
import { ProfileSettingsPanel } from "@/components/profile-settings-panel";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkHoursPermit } from "@/components/work-hours-permit";
import type { AiProviderSettingSummary } from "@/components/ai-insight-button";
import type { DashboardAnalytics } from "@/lib/dashboard-analytics";
import { getFirstName, getTimeGreeting } from "@/lib/dashboard-greeting";
import type { UserProfileData } from "@/lib/user-profile";
import type { WorkHourLog } from "@/lib/work-hours";

type DashboardApplication = {
  applied_date: string | null;
  company: string;
  created_at: string;
  follow_up_date: string | null;
  id: string;
  job_description: string | null;
  location: string | null;
  notes: string | null;
  role: string;
  source: string | null;
  status: "saved" | "applied" | "interview" | "rejected" | "offer";
  url: string | null;
};

type DashboardEvidence = {
  application_id: string | null;
  confidence: "direct" | "bridge" | "basic" | "learning" | "missing";
  evidence_summary: string | null;
  proof_url: string | null;
  skill: string;
};

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

type DashboardShellProps = {
  aiProviderSettings: AiProviderSettingSummary[];
  aiSettingsTableReady: boolean;
  analytics: DashboardAnalytics;
  applications: DashboardApplication[];
  applicationsTableReady: boolean;
  dashboardApplications: DashboardApplicationCard[];
  evidence: DashboardEvidence[];
  evidenceTableReady: boolean;
  fullName: string;
  profile: UserProfileData;
  profileReadiness: number;
  profileTableReady: boolean;
  targetRole: string;
  userId: string;
  workHourLogs: WorkHourLog[];
  workHoursTableReady: boolean;
};

const moduleDescriptions: Record<DashboardModule, string> = {
  overview: "Your compliance and progress overview.",
  applications: "Keep every opportunity, status, and follow-up in one place.",
  "work-hours": "Record your hours and stay aware of your permit limits.",
  "skill-gap": "Map job requirements to evidence and practical proof tasks.",
  "cv-check": "Inspect your CV for readable, evidence-backed claims.",
  assistant: "Turn real evidence into focused application angles.",
  profile: "Keep your career context ready for every application.",
  "ai-insights": "Optional AI support powered by your own provider key.",
};

export function DashboardShell({
  aiProviderSettings,
  aiSettingsTableReady,
  analytics,
  applications,
  applicationsTableReady,
  dashboardApplications,
  evidence,
  evidenceTableReady,
  fullName,
  profile,
  profileReadiness,
  profileTableReady,
  targetRole,
  userId,
  workHourLogs,
  workHoursTableReady,
}: DashboardShellProps) {
  const [activeModule, setActiveModule] = useState<DashboardModule>("overview");
  const [greeting, setGreeting] = useState("Welcome back");
  const activeLabel = navItems.find((item) => item.module === activeModule)?.label ?? "Overview";
  const firstName = getFirstName(fullName);

  useEffect(() => {
    // Use the browser's local time after hydration so the greeting never causes a server/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getTimeGreeting());
  }, []);

  function navigateTo(module: DashboardModule) {
    setActiveModule(module);
  }

  return (
    <main className="h-[100dvh] min-h-0 overflow-hidden bg-[#171A1F] text-[#F7F8F6]">
      <section className="dashboard-frame grid h-full min-h-0 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col bg-[#262B34] px-5 py-8 lg:flex">
          <div className="mb-8 px-3 text-white">
            <CareerOSWordmark />
          </div>

          <div className="mb-7 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2 font-mono text-[0.67rem] uppercase tracking-[0.16em] text-white/48">
              Personal workspace
            </p>
            <p className="font-serif text-[1.7rem] font-normal leading-none tracking-[-0.01em]" data-testid="dashboard-greeting">
              {greeting}, {firstName}
            </p>
            <p className="mt-3 text-sm leading-5 text-white/58">{targetRole}</p>
          </div>

          <DashboardNavigation
            activeModule={activeModule}
            onNavigate={navigateTo}
            variant="desktop"
          />

          <SignOutButton />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#171A1F]">
          <header className="flex shrink-0 items-center justify-between gap-6 px-6 pb-4 pt-4 md:px-8 lg:px-9 lg:pb-5 lg:pt-5">
            <button
              className="flex h-12 w-full max-w-[430px] items-center gap-3 rounded-xl border border-white/10 bg-[#222833] px-5 text-left text-[#AEB6C2] transition hover:border-white/20 hover:text-white"
              onClick={() => navigateTo("applications")}
              title="Open applications"
              type="button"
            >
              <Search size={21} strokeWidth={1.7} />
              <span className="text-base">Search applications</span>
            </button>

            <div className="hidden items-center gap-5 text-white/82 md:flex">
              <Bell size={23} strokeWidth={1.7} />
              <HelpCircle size={25} strokeWidth={1.7} />
            </div>
          </header>

          <div className="shrink-0 px-6 md:px-8 lg:hidden">
            <DashboardNavigation
              activeModule={activeModule}
              onNavigate={navigateTo}
              variant="mobile"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 md:px-8 lg:px-9 lg:pb-8">
            {activeModule !== "overview" && (
              <div className="mb-5 border-b border-white/10 pb-4">
                <p className="mb-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/46">
                  CareerOS module
                </p>
                <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-none tracking-[-0.01em]">
                  {activeLabel}
                </h1>
                <p className="mt-2 text-sm text-[#AEB6C2]">{moduleDescriptions[activeModule]}</p>
              </div>
            )}

            {activeModule === "overview" && (
              <OverviewModule
                analytics={analytics}
                applications={dashboardApplications}
                onNavigate={navigateTo}
                profileReadiness={profileReadiness}
                workHourLogs={workHourLogs}
                workHoursTableReady={workHoursTableReady}
                userId={userId}
              />
            )}

            {activeModule === "applications" && (
              <section className="space-y-5">
                <AddApplicationForm userId={userId} />
                <ApplicationManagementPanel
                  applications={applications.map(
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
                  tableReady={applicationsTableReady}
                />
                {!applicationsTableReady && <TableWarning table="applications" />}
              </section>
            )}

            {activeModule === "work-hours" && (
              <WorkHoursPermit
                logs={workHourLogs}
                tableReady={workHoursTableReady}
                userId={userId}
              />
            )}

            {activeModule === "skill-gap" && (
              <JdEvidenceWorkspace
                aiSettings={aiProviderSettings}
                applications={applications.map((application) => ({
                  id: application.id,
                  company: application.company,
                  role: application.role,
                  job_description: application.job_description,
                }))}
                cvText={profile.cv_text}
                evidenceTableReady={evidenceTableReady}
                initialEvidence={evidence}
                userId={userId}
              />
            )}

            {activeModule === "cv-check" && (
              <CvCheckPanel
                aiSettings={aiProviderSettings}
                applications={applications.map((application) => ({
                  id: application.id,
                  company: application.company,
                  role: application.role,
                  job_description: application.job_description,
                }))}
                initialCvText={profile.cv_text}
                userId={userId}
              />
            )}

            {activeModule === "assistant" && (
              <ApplicationAssistantPanel
                applications={applications.map((application) => ({
                  id: application.id,
                  company: application.company,
                  role: application.role,
                  job_description: application.job_description,
                }))}
                evidence={evidence.map((item) => ({
                  application_id: item.application_id,
                  skill: item.skill,
                  evidence_summary: item.evidence_summary,
                  confidence: item.confidence,
                  proof_url: item.proof_url,
                }))}
              />
            )}

            {activeModule === "profile" && (
              <ProfileSettingsPanel
                initialProfile={profile}
                tableReady={profileTableReady}
                userId={userId}
              />
            )}

            {activeModule === "ai-insights" && (
              <AiSettingsPanel
                initialSettings={aiProviderSettings}
                tableReady={aiSettingsTableReady}
              />
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function OverviewModule({
  analytics,
  applications,
  onNavigate,
  profileReadiness,
  userId,
  workHourLogs,
  workHoursTableReady,
}: {
  analytics: DashboardAnalytics;
  applications: DashboardApplicationCard[];
  onNavigate: (module: DashboardModule) => void;
  profileReadiness: number;
  userId: string;
  workHourLogs: WorkHourLog[];
  workHoursTableReady: boolean;
}) {
  return (
    <>
      <section className="dashboard-card-tint dashboard-card-blue mb-5 rounded-[20px] p-4 shadow-dashboard-card md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-none tracking-[-0.01em]">
            CareerOS Control
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.62fr))]">
          <div>
            <WorkHoursPermit
              logs={workHourLogs}
              tableReady={workHoursTableReady}
              userId={userId}
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
          <MiniStatusCard
            label="Profile readiness"
            title={`${profileReadiness}%`}
            tone="blue"
            value="Profile context"
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-[clamp(1.7rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
            Applications in motion
          </h2>
          <button
            aria-label="Open application filters"
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#252B36] text-white/85 transition hover:bg-[#303849]"
            onClick={() => onNavigate("applications")}
            title="Open applications"
            type="button"
          >
            <SlidersHorizontal size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.25fr]">
          {applications.length > 0 ? (
            applications.slice(0, 2).map((application) => (
              <ApplicationCard application={application} key={application.id} />
            ))
          ) : (
            <EmptyApplicationsCard onNavigate={onNavigate} />
          )}

          <article className="dashboard-card-tint dashboard-card-plum rounded-[22px] p-4">
            <p className="mb-3 text-center text-lg font-medium text-white/90">Skill gap grade</p>
            <div className="mb-3 text-center text-5xl font-light tracking-[-0.05em] text-[#2C7BE5]">
              {analytics.skillGapGrade}
            </div>
            <div className="relative mx-auto mb-3 h-16 max-w-[280px]">
              <svg aria-hidden="true" className="h-full w-full overflow-visible" viewBox="0 0 320 120">
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
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${index === 0 ? "bg-[#EC43A3]" : "bg-white/80"}`} />
                  {item.skill}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <DashboardAnalyticsPanel analytics={analytics} />
    </>
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
  tone: "blue" | "clay" | "sage";
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

function ApplicationCard({ application }: { application: DashboardApplicationCard }) {
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
      <div className="h-20 p-4" style={{ background: application.image }}>
        <span className="rounded-lg border border-white/15 bg-[#202733]/90 px-3 py-1.5 text-sm font-medium text-white">
          {application.company}
        </span>
      </div>
      <div className="p-4">
        <p className="mb-2 text-base text-[#C9D4E2]">{application.role}</p>
        <h3 className="mb-3 font-serif text-xl font-normal tracking-[-0.01em]">{application.location}</h3>
        <div className="mb-3 h-px bg-white/12" />
        <div className="flex items-center justify-between text-sm text-[#AEB6C2]">
          <span>{application.meta}</span>
          <span className={`h-3 w-3 rounded-full ${application.dot}`} />
        </div>
      </div>
    </article>
  );
}

function EmptyApplicationsCard({ onNavigate }: { onNavigate: (module: DashboardModule) => void }) {
  return (
    <article className="dashboard-card-tint dashboard-card-clay flex min-h-[238px] flex-col justify-between rounded-[22px] p-5 xl:col-span-2">
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-[#AEB6C2]">No applications yet</p>
        <h3 className="font-serif text-3xl font-normal leading-none tracking-[-0.01em]">Start with one real job.</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#AEB6C2]">
          Add a job description to unlock the evidence map, fit signals, and follow-up workflow.
        </p>
      </div>
      <button
        className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.09]"
        onClick={() => onNavigate("applications")}
        type="button"
      >
        Add your first job <span className="text-lg leading-none">→</span>
      </button>
    </article>
  );
}

function TableWarning({ table }: { table: "applications" }) {
  return (
    <div className="rounded-[22px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
      Supabase table is not ready yet. Run <code className="rounded bg-black/20 px-1.5 py-1">supabase/schema.sql</code> to enable saved {table}.
    </div>
  );
}
