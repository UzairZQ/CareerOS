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
import { useEffect, useState } from "react";

const navItems: Array<{ label: string; icon: LucideIcon; href: `#${string}` }> = [
  { label: "Overview", icon: SlidersHorizontal, href: "#overview" },
  { label: "Applications", icon: BriefcaseBusiness, href: "#applications" },
  { label: "Work Hours", icon: Timer, href: "#work-hours" },
  { label: "Skill Gap", icon: ChartNoAxesCombined, href: "#skill-gap" },
  { label: "CV Check", icon: FileCheck2, href: "#cv-check" },
  { label: "Assistant", icon: FileCheck2, href: "#assistant" },
  { label: "Profile", icon: UserRound, href: "#profile" },
  { label: "AI Insights", icon: KeyRound, href: "#ai-insights" },
];

export function DashboardNavigation({ variant }: { variant: "desktop" | "mobile" }) {
  const [activeHref, setActiveHref] = useState("#overview");

  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector(item.href))
      .filter((section): section is Element => Boolean(section));

    if (sections.length === 0 || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const visibleSection = visibleSections[0];
        if (visibleSection) {
          setActiveHref(`#${visibleSection.target.id}`);
        }
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: [0, 0.2, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

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
        const isActive = activeHref === item.href;
        return (
          <a
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
            href={item.href}
            key={item.href}
            onClick={() => setActiveHref(item.href)}
          >
            {!isMobile && <Icon size={22} strokeWidth={1.8} />}
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
