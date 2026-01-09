import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily overdue check and notification - runs at 8 AM every day
crons.daily(
  "daily-overdue-check",
  { hourUTC: 0, minuteUTC: 0 }, // 8 AM PHT (UTC+8)
  internal.reports.checkOverdueBooks
);

// Weekly report summary - runs every Monday at 9 AM
crons.weekly(
  "weekly-report-summary",
  { dayOfWeek: "monday", hourUTC: 1, minuteUTC: 0 }, // 9 AM PHT
  internal.reports.generateWeeklySummary
);

// Monthly inventory reminder - runs on the 1st of each month
crons.monthly(
  "monthly-inventory-reminder",
  { day: 1, hourUTC: 1, minuteUTC: 0 }, // 9 AM PHT on the 1st
  internal.reports.generateMonthlySummary
);

export default crons;
