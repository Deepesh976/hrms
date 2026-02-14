const Activity = require('../../models/Activity');
const {
  calculateMonthlySummary,
  saveMonthlySummary,
  getPayrollCycleFromDate,
} = require('./monthlySummaryService');

/**
 * Regenerate monthly summaries for a SINGLE employee
 * 🔒 Payroll cycle: 21 → 20 (single source of truth)
 * 📅 Total days: ALWAYS from calendar (NOT from understanding counts)
 */
const regenerateMonthlySummaryForEmployee = async (empId) => {
  if (!empId) return;

  const activities = await Activity.find({ empId }).sort({ date: 1 });
  if (!activities.length) return;

  /* =========================
     GROUP ACTIVITIES BY PAYROLL CYCLE
     (21 → 20)
  ========================= */
  const cycles = {};

  for (const act of activities) {
    const { year, month } = getPayrollCycleFromDate(act.date);
    const key = `${year}-${month}`;

    if (!cycles[key]) {
      cycles[key] = {
        empName: act.empName,
        year,
        month,
        activities: [],
      };
    }

    cycles[key].activities.push(act);
  }

  /* =========================
     GENERATE & SAVE SUMMARIES
  ========================= */
  for (const key of Object.keys(cycles)) {
    const { empName, activities, year, month } = cycles[key];
    if (!activities.length) continue;

    // 🔹 Calculate summary from activities
    const summary = calculateMonthlySummary(
      empId,
      empName,
      activities
    );

    if (!summary) continue;

    /* ======================================
       🔥 CRITICAL FIX — TOTAL DAYS
       SINGLE SOURCE OF TRUTH = CALENDAR
    ====================================== */
    const calendarTotalDays = new Date(year, month, 0).getDate();

    summary.totalDays = calendarTotalDays;

    // 🧪 Optional safety log (keep during testing)
    console.log(
      `📅 MonthlySummary FIXED | ${empId} | ${month}/${year} | totalDays=${calendarTotalDays}`
    );

    await saveMonthlySummary(summary);
  }
};

module.exports = {
  regenerateMonthlySummaryForEmployee,
};
