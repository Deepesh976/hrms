const Activity = require('../../models/Activity');
const {
  calculateMonthlySummary,
  saveMonthlySummary,
} = require('./monthlySummaryService');

/**
 * Generate monthly summary for ALL employees
 * 🔒 Payroll cycle: 21 → 20
 * 🔒 TOTAL DAYS = Attendance ONLY (NO CALENDAR)
 */
const generateMonthlySummaryForCycle = async (cycleDate) => {
  /* =====================================================
     1️⃣ DERIVE PAYROLL YEAR & MONTH (21 → 20)
  ===================================================== */
  const d = new Date(cycleDate);
  d.setHours(0, 0, 0, 0);

  let year = d.getFullYear();
  let month = d.getMonth() + 1;

  if (d.getDate() < 21) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  /* =====================================================
     2️⃣ PAYROLL DATE RANGE (21 → 20)
  ===================================================== */
  const startDate = new Date(year, month - 1, 21, 0, 0, 0, 0);
  const endDate = new Date(year, month, 20, 23, 59, 59, 999);

  /* =====================================================
     3️⃣ FETCH ACTIVITIES
  ===================================================== */
  const activities = await Activity.find({
    date: { $gte: startDate, $lte: endDate },
  }).sort({ empId: 1, date: 1 });

  /* =====================================================
     4️⃣ GROUP BY EMPLOYEE
  ===================================================== */
  const employeeMap = {};

  for (const act of activities) {
    if (!employeeMap[act.empId]) {
      employeeMap[act.empId] = {
        empName: act.empName,
        activities: [],
      };
    }
    employeeMap[act.empId].activities.push(act);
  }

  /* =====================================================
     5️⃣ GENERATE & SAVE MONTHLY SUMMARY
  ===================================================== */
  let count = 0;

  for (const empId of Object.keys(employeeMap)) {
    const { empName, activities } = employeeMap[empId];
    if (!activities.length) continue;

    const summary = calculateMonthlySummary(empId, empName, activities);
    if (!summary) continue;

    /* =====================================================
       🔥 FINAL SOURCE OF TRUTH — ATTENDANCE
    ===================================================== */
    const totalPresent = Number(summary.totalPresent || 0);
    const totalWO = Number(summary.totalWOCount || 0);
    const totalHO = Number(summary.totalHOCount || 0);
    const totalAbsent = Number(summary.totalAbsent || 0);

    summary.totalDays =
      totalPresent + totalWO + totalHO + totalAbsent;

    console.log(
      `📊 MonthlySummary FINAL | ${empId} | ${month}/${year} | ` +
      `P=${totalPresent}, WO=${totalWO}, HO=${totalHO}, A=${totalAbsent}, TOTAL=${summary.totalDays}`
    );

    await saveMonthlySummary(summary);
    count++;
  }

  return {
    cycle: `${startDate.toDateString()} → ${endDate.toDateString()}`,
    employeesProcessed: count,
  };
};

module.exports = {
  generateMonthlySummaryForCycle,
};
