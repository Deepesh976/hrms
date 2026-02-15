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

  d.setDate(21);
  return d.toISOString().slice(0, 10);
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

  return { year, month, cycleStart, cycleEnd };
};

/* =========================================================
   CALCULATE MONTHLY SUMMARY (SUPER SIMPLE VERSION)
   totalDays = P + A + WO + HO + ALF + ALH
========================================================= */

const calculateMonthlySummary = (empId, empName, activities) => {
  if (!activities || !activities.length) return null;

  /* =========================
     GROUP BY PAYROLL CYCLE
  ========================= */
  const cycleMap = {};

  for (const act of activities) {
    const key = getPayrollCycleKey(act.date);
    if (!cycleMap[key]) cycleMap[key] = [];
    cycleMap[key].push(act);
  }

  const cycleKey = Object.keys(cycleMap)[0];
  if (!cycleKey) return null;

  const cycleActs = cycleMap[cycleKey];

  /* =========================
     COUNTERS
  ========================= */
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalALF = 0;
  let totalALH = 0;
  let totalWOCount = 0;
  let totalHOCount = 0;
  let weeklyOffPresent = 0;

  /* =========================
     COUNT STATUS
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

      case 'ALF':
        totalALF += 1;
        break;

      case 'ALH':
        totalALH += 1;
        break;

      case 'WO':
        totalWOCount += 1;

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

  /* =========================
     META
  ========================= */
  const { year, month, cycleStart, cycleEnd } =
    getCycleMetaFromKey(cycleKey);

  /* =========================================================
     🔥 FINAL TOTAL DAYS (VERY SIMPLE)
  ========================================================= */
  const totalDays =
    totalPresent +
    totalAbsent +
    totalWOCount +
    totalHOCount +
    totalALF +
    totalALH;

  /* =========================
     Days Worked (salary logic)
     AL not included here
  ========================= */
  const daysWorked =
    totalPresent +
    totalWOCount +
    totalHOCount;

  return {
    empId,
    empName,

    year,
    month,
    cycleStart,
    cycleEnd,

    totalDays,        // ✅ Now will show 30 correctly

    totalPresent,
    totalAbsent,

    totalALF,
    totalALH,

    totalWOCount,
    totalHOCount,
    weeklyOffPresent,

    daysWorked,
  };
};

/* =========================================================
   SAVE SUMMARY
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
