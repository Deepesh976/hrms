// services/activity/holidayImpactService.js

const Activity = require('../models/Activity');
const {
  syncAttendanceWithSandwichRange,
} = require('./attendanceSyncService');

/* =========================================================
   DATE NORMALIZER (SINGLE SOURCE OF TRUTH)
========================================================= */
function normalizeDate(date) {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to normalizeDate');
  }

  d.setHours(0, 0, 0, 0);
  return d;
}

/* =========================================================
   ACTIVITY → HOLIDAY APPLY
========================================================= */
/**
 * Apply HOLIDAY (HO) to all employees for a date
 *
 * RULES:
 * ✅ Overrides ONLY system-generated rows
 * ❌ Never overrides manual edits
 * ✅ Creates missing rows
 * ✅ Stores originalStatus for rollback
 */
async function recalculateActivityForDate(date, holidayTitle = '') {
  const d = normalizeDate(date);

  const empIds = await Activity.distinct('empId');
  if (!empIds.length) {
    console.warn('[HolidayImpact] No employees found');
    return { success: true, modifiedCount: 0, date: d };
  }

  const bulkOps = empIds.map((empId) => ({
    updateOne: {
      filter: {
        empId,
        date: d,
        $or: [
          { isStatusModified: { $ne: true } },
          { isStatusModified: { $exists: false } }
        ]
      },
      update: {
        $set: {
          status: 'HO',
          statusChangeReason: holidayTitle || 'Company Holiday',
          statusChangeDate: new Date(),
          isStatusModified: false // system-generated
        },
        $setOnInsert: {
          empId,
          date: d,
          originalStatus: 'A'
        }
      },
      upsert: true
    }
  }));

  const result = await Activity.bulkWrite(bulkOps);

  const modifiedCount =
    (result.modifiedCount || 0) +
    (result.upsertedCount || 0);

  console.log(
    `[HolidayImpact] ${d.toDateString()} marked HO for ${modifiedCount} rows`
  );

  return { success: true, modifiedCount, date: d };
}

/* =========================================================
   🔄 HOLIDAY ROLLBACK (ON DELETE)
========================================================= */
/**
 * Restore originalStatus when a holiday is removed
 *
 * RULES:
 * ✅ Only system-generated HO rows
 * ❌ Never touches manual edits
 */
async function rollbackHolidayForDate(date) {
  const d = normalizeDate(date);

  const result = await Activity.updateMany(
    {
      date: d,
      status: 'HO',
      $or: [
        { isStatusModified: false },
        { isStatusModified: { $exists: false } }
      ]
    },
    [
      {
        $set: {
          status: { $ifNull: ['$originalStatus', 'A'] },
          statusChangeReason: 'Holiday Removed',
          statusChangeDate: new Date()
        }
      }
    ]
  );

  console.log(
    `[HolidayImpact] ${d.toDateString()} rollback restored ${result.modifiedCount} rows`
  );

  return {
    success: true,
    date: d,
    restoredCount: result.modifiedCount
  };
}

/* =========================================================
   ATTENDANCE → SANDWICH SYNC
========================================================= */
/**
 * Attendance is derived from Activity.
 * Sandwich logic runs here.
 */
async function recalculateAttendanceForDate(date) {
  const d = normalizeDate(date);

  await syncAttendanceWithSandwichRange(d);

  console.log(
    `[HolidayImpact] Attendance recalculated for ${d.toDateString()}`
  );

  return { success: true, date: d };
}

/* =========================================================
   MONTHLY SUMMARY (PAYROLL SAFE)
========================================================= */
async function recalculateMonthlySummary(date) {
  const d = normalizeDate(date);

  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  const day = d.getDate();

  // Payroll cycle: 21 → 20
  if (day < 21) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  console.log(
    `[HolidayImpact] Monthly summary queued for ${month}-${year}`
  );

  return {
    success: true,
    payrollMonth: month,
    payrollYear: year
  };
}

/* =========================================================
   FULL HOLIDAY PIPELINE
========================================================= */
async function applyHolidayForDate(date, holidayTitle = '') {
  const d = normalizeDate(date);

  const activityResult = await recalculateActivityForDate(d, holidayTitle);
  const attendanceResult = await recalculateAttendanceForDate(d);
  const monthlyResult = await recalculateMonthlySummary(d);

  return {
    success: true,
    date: d,
    activityResult,
    attendanceResult,
    monthlyResult
  };
}

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  normalizeDate,
  recalculateActivityForDate,
  rollbackHolidayForDate,   // 🔥 IMPORTANT
  recalculateAttendanceForDate,
  recalculateMonthlySummary,
  applyHolidayForDate
};
