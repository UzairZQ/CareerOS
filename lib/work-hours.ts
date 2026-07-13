export type WorkHourLog = {
  id: string;
  work_date: string;
  employer: string | null;
  hours: number;
  day_type: "full" | "half";
  notes: string | null;
};

export type WorkHourStats = {
  weeklyHours: number;
  yearlyEquivalentDays: number;
  yearlyFullDays: number;
  yearlyHalfDays: number;
  weeklyLimit: number;
  yearlyEquivalentDayLimit: number;
  yearlyFullDayLimit: number;
  yearlyHalfDayLimit: number;
  isWeeklyCompliant: boolean;
  isYearlyCompliant: boolean;
  status: "compliant" | "warning" | "over-limit";
};

export function getIsoWeekRange(date = new Date()) {
  const anchor = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = anchor.getUTCDay() || 7;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export function getYearRange(date = new Date()) {
  const year = date.getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function calculateWorkHourStats(logs: WorkHourLog[], date = new Date()): WorkHourStats {
  const week = getIsoWeekRange(date);
  const year = getYearRange(date);
  const logsThisWeek = logs.filter(
    (log) => log.work_date >= week.start && log.work_date <= week.end,
  );
  const logsThisYear = logs.filter(
    (log) => log.work_date >= year.start && log.work_date <= year.end,
  );
  const weeklyHours = sum(logsThisWeek.map((log) => Number(log.hours)));
  const yearlyFullDays = logsThisYear.filter((log) => log.day_type === "full").length;
  const yearlyHalfDays = logsThisYear.filter((log) => log.day_type === "half").length;
  const yearlyEquivalentDays = Number((yearlyFullDays + yearlyHalfDays / 2).toFixed(1));
  const weeklyLimit = 20;
  const yearlyEquivalentDayLimit = 140;
  const yearlyFullDayLimit = 140;
  const yearlyHalfDayLimit = 280;
  const isWeeklyCompliant = weeklyHours <= weeklyLimit;
  const isYearlyCompliant = yearlyEquivalentDays <= yearlyEquivalentDayLimit;
  const warningThresholdReached =
    weeklyHours >= weeklyLimit * 0.8 ||
    yearlyEquivalentDays >= yearlyEquivalentDayLimit * 0.8;

  return {
    weeklyHours,
    yearlyEquivalentDays,
    yearlyFullDays,
    yearlyHalfDays,
    weeklyLimit,
    yearlyEquivalentDayLimit,
    yearlyFullDayLimit,
    yearlyHalfDayLimit,
    isWeeklyCompliant,
    isYearlyCompliant,
    status: !isWeeklyCompliant || !isYearlyCompliant
      ? "over-limit"
      : warningThresholdReached
        ? "warning"
        : "compliant",
  };
}

function sum(values: number[]) {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
}
