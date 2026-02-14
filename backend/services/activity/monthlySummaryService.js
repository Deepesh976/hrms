const MonthlySummary = require('../../models/MonthlySummary');

/* =========================================================
   PAYROLL CYCLE HELPERS
   Cycle = 21st → 20th
========================================================= */
const getPayrollCycleKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getDate() < 21) {
    d.setMonth(d.getMonth() - 1);
  }

  d.setDate(21); // lock to cycle start
  return d.toISOString().slice(0, 10); // yyyy-mm-21
};

const getCycleMetaFromKey = (cycleKey) => {
  const cycleStart = new Date(cycleKey);
  cycleStart.setHours(0, 0, 0, 0);

  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);
  cycleEnd.setDate(20);
  cycleEnd.setHours(23, 59, 59, 999);

  const year = cycleStart.getFullYear();
  const month = cycleStart.getMonth() + 1;

  const totalDays =
    Math.round((cycleEnd - cycleStart) / (1000 * 60 * 60 * 24)) + 1;

  return { year, month, cycleStart, cycleEnd, totalDays };
};

/* =========================================================
   CALCULATE MONTHLY SUMMARY (FINAL – PAYROLL SAFE)
========================================================= */
const calculateMonthlySummary = (empId, empName, activities) => {
  if (!activities || !activities.length) return null;

  /* =========================
     1️⃣ GROUP BY PAYROLL CYCLE
  ========================= */
  const cycleMap = {};

  for (const act of activities) {
    const key = getPayrollCycleKey(act.date);
    if (!cycleMap[key]) cycleMap[key] = [];
    cycleMap[key].push(act);
  }

  /* =========================
     2️⃣ ONLY ONE CYCLE EXPECTED
     (caller already groups)
  ========================= */
  const cycleKey = Object.keys(cycleMap)[0];
  if (!cycleKey) return null;

  const cycleActs = cycleMap[cycleKey];

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLeaveTaken = 0;
  let totalWOCount = 0;
  let totalHOCount = 0;
  let weeklyOffPresent = 0;

  /* =========================
     3️⃣ AGGREGATE DAY BY DAY
  ========================= */
  for (const act of cycleActs) {
    switch (act.status) {
      case 'P':
        totalPresent += 1;
        break;

      case '½P':
        totalPresent += 0.5;
        totalAbsent += 0.5;
        break;

      case 'A':
        totalAbsent += 1;
        break;

      case 'L':
        totalLeaveTaken += 1;
        totalAbsent += 1;
        break;

      case 'WO':
        totalWOCount += 1;
        // weekly off worked
        if (act.timeInActual && act.timeInActual !== '00:00:00') {
          weeklyOffPresent += 1;
        }
        break;

      case 'HO':
        totalHOCount += 1;
        break;

      default:
        break;
    }
  }

  const {
    year,
    month,
    cycleStart,
    cycleEnd,
    totalDays,
  } = getCycleMetaFromKey(cycleKey);

  /* =========================
     4️⃣ FINAL SUMMARY OBJECT
  ========================= */
  return {
    empId,
    empName,

    year,
    month,
    cycleStart,
    cycleEnd,
    totalDays,

    totalPresent,
    totalAbsent,
    totalLeaveTaken,
    totalWOCount,
    totalHOCount,
    weeklyOffPresent,

    // derived (used by salary)
    daysWorked: totalPresent + totalWOCount + totalHOCount,
  };
};

/* =========================================================
   SAVE SUMMARY (UPSERT – ONE PER EMP PER CYCLE)
========================================================= */
const saveMonthlySummary = async (summary) => {
  if (!summary) return null;

  return MonthlySummary.updateOne(
    {
      empId: summary.empId,
      year: summary.year,
      month: summary.month,
    },
    { $set: summary },
    { upsert: true }
  );
};

module.exports = {
  calculateMonthlySummary,
  saveMonthlySummary,
};
