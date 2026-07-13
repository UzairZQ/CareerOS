import { describe, expect, it } from "vitest";
import { calculateWorkHourStats } from "@/lib/work-hours";

describe("work-hour allowance calculations", () => {
  it("combines full and half days against the shared yearly allowance", () => {
    const stats = calculateWorkHourStats(
      [
        ...Array.from({ length: 140 }, (_, index) => ({
          day_type: "full" as const,
          employer: "Employer",
          hours: 4,
          id: `full-${index}`,
          notes: null,
          work_date: "2026-01-01",
        })),
        ...Array.from({ length: 2 }, (_, index) => ({
          day_type: "half" as const,
          employer: "Employer",
          hours: 2,
          id: `half-${index}`,
          notes: null,
          work_date: "2026-01-02",
        })),
      ],
      new Date("2026-07-10T12:00:00.000Z"),
    );

    expect(stats.yearlyEquivalentDays).toBe(141);
    expect(stats.isYearlyCompliant).toBe(false);
    expect(stats.status).toBe("over-limit");
  });

  it("keeps the maximum equivalent allowance compliant", () => {
    const stats = calculateWorkHourStats(
      [
        ...Array.from({ length: 139 }, (_, index) => ({
          day_type: "full" as const,
          employer: "Employer",
          hours: 4,
          id: `full-${index}`,
          notes: null,
          work_date: "2026-01-01",
        })),
        {
          day_type: "half" as const,
          employer: "Employer",
          hours: 2,
          id: "half",
          notes: null,
          work_date: "2026-01-02",
        },
      ],
      new Date("2026-07-10T12:00:00.000Z"),
    );

    expect(stats.yearlyEquivalentDays).toBe(139.5);
    expect(stats.isYearlyCompliant).toBe(true);
  });
});
