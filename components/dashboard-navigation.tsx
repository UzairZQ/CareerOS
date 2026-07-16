"use client";

import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileCheck2,
  KeyRound,
  SlidersHorizontal,
  Timer,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type DashboardModule =
  | "overview"
  | "applications"
  | "work-hours"
  | "skill-gap"
  | "cv-check"
  | "assistant"
  | "profile"
  | "ai-insights";

export const navItems: Array<{ label: string; icon: LucideIcon; module: DashboardModule }> = [
  { label: "Overview", icon: SlidersHorizontal, module: "overview" },
  { label: "Applications", icon: BriefcaseBusiness, module: "applications" },
  { label: "Work Hours", icon: Timer, module: "work-hours" },
  { label: "Skill Gap", icon: ChartNoAxesCombined, module: "skill-gap" },
  { label: "CV Check", icon: FileCheck2, module: "cv-check" },
  { label: "Assistant", icon: FileCheck2, module: "assistant" },
  { label: "Profile", icon: UserRound, module: "profile" },
  { label: "AI Insights", icon: KeyRound, module: "ai-insights" },
];

export function DashboardNavigation({
  activeModule,
  onNavigate,
  variant,
}: {
  activeModule: DashboardModule;
  onNavigate: (module: DashboardModule) => void;
  variant: "desktop" | "mobile";
}) {

  const isMobile = variant === "mobile";

  return (
    <nav
      aria-label={isMobile ? "Dashboard modules" : "Dashboard sidebar modules"}
      className={
        isMobile
          ? "dashboard-module-nav mb-4 flex gap-2 overflow-x-auto rounded-[18px] border border-white/10 bg-[#222833]/82 p-2 lg:hidden"
          : "flex flex-1 flex-col gap-3"
      }
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.module;
        return (
          <button
            aria-current={isActive ? "location" : undefined}
            aria-label={item.label}
            className={
              isMobile
                ? `shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none ${
                    isActive ? "bg-white/[0.1] text-white" : "text-white/68 hover:bg-white/[0.06] hover:text-white"
                  }`
                : `flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none ${
                    isActive
                      ? "bg-white/[0.09] text-white ring-1 ring-inset ring-[#2C7BE5]/35"
                      : "text-white/64 hover:bg-white/5 hover:text-white"
                  }`
            }
            data-testid={`dashboard-nav-${variant}-${item.label.toLowerCase().replaceAll(" ", "-")}`}
            key={item.module}
            onClick={() => onNavigate(item.module)}
            type="button"
          >
            {!isMobile && <Icon size={22} strokeWidth={1.8} />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
