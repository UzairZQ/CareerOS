import { BarChart3, BriefcaseBusiness, FileCheck2, Target } from "lucide-react";
import type React from "react";
import type { DashboardAnalytics } from "@/lib/dashboard-analytics";

export function DashboardAnalyticsPanel({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <section className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="card-sheen rounded-[22px] border border-white/10 p-4 shadow-dashboard-card md:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
              <BarChart3 size={17} strokeWidth={1.8} />
              Dashboard Analytics
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
              Signal from your search
            </h2>
          </div>
          <span className="stamp rounded-full px-3 py-2 text-[0.67rem] font-semibold uppercase text-[#DDF0DD]">
            Live
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <AnalyticsMetric
            icon={<BriefcaseBusiness size={18} strokeWidth={1.8} />}
            label="Applications"
            value={String(analytics.totalApplications)}
            detail={`${analytics.activeApplications} active`}
          />
          <AnalyticsMetric
            icon={<Target size={18} strokeWidth={1.8} />}
            label="Response rate"
            value={`${analytics.responseRate}%`}
            detail="Interview, offer, or rejection"
          />
          <AnalyticsMetric
            icon={<FileCheck2 size={18} strokeWidth={1.8} />}
            label="Evidence ready"
            value={String(analytics.cvReadyEvidenceCount)}
            detail={`${analytics.evidenceCoverage}% coverage`}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[18px] border border-white/10 bg-[#171A1F]/54 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">
              Next follow-up
            </p>
            <p className="font-serif text-3xl leading-none">{analytics.nextFollowUpLabel}</p>
            <p className="mt-2 text-sm text-[#AEB6C2]">{analytics.nextFollowUpCompany}</p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-[#171A1F]/54 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">
              Skill gap grade
            </p>
            <p className="font-serif text-5xl leading-none text-[#2C7BE5]">
              {analytics.skillGapGrade}
            </p>
            <p className="mt-2 text-sm text-[#AEB6C2]">Based on requested skills with proof</p>
          </div>
        </div>
      </article>

      <article className="card-sheen rounded-[22px] border border-white/10 p-4 shadow-dashboard-card md:p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <AnalyticsList title="Top requested skills" items={analytics.mostRequestedSkills} tone="blue" />
          <AnalyticsList title="Common missing skills" items={analytics.mostMissingSkills} tone="amber" />
          <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
              Best-fit roles
            </p>
            <div className="space-y-3">
              {analytics.bestFitRoleCategories.length > 0 ? (
                analytics.bestFitRoleCategories.map((item) => (
                  <div key={item.role}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="truncate text-white/82">{item.role}</span>
                      <span className="font-mono text-[#AEB6C2]">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[#5C7A5C]"
                        style={{
                          width: `${Math.min(100, item.count * 34)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#AEB6C2]">
                  Add job descriptions to discover fit categories.
                </p>
              )}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function AnalyticsMetric({
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#303849] p-4">
      <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">
        {icon}
        {label}
      </p>
      <p className="font-serif text-4xl leading-none">{value}</p>
      <p className="mt-2 text-sm text-[#AEB6C2]">{detail}</p>
    </div>
  );
}

function AnalyticsList({
  items,
  title,
  tone,
}: {
  items: Array<{ skill: string; count: number }>;
  title: string;
  tone: "blue" | "amber";
}) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
        {title}
      </p>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.skill}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate text-white/82">{item.skill}</span>
                <span className="font-mono text-[#AEB6C2]">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full ${tone === "blue" ? "bg-[#2C7BE5]" : "bg-[#C77D2E]"}`}
                  style={{ width: `${Math.max(12, (item.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#AEB6C2]">No data yet.</p>
        )}
      </div>
    </div>
  );
}
