// services/activity/attendanceSyncService.js

const Activity = require('../models/Activity');

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
   SANDWICH RULE ENGINE
========================================================= */
/**
 * Sandwich applies when:
 * - Current day is WO or HO
 * - Previous day is L or A
 * - Next day is L or A
 * - ❌ Half-day (½P) on either side breaks sandwich
 * - ❌ Manual edits are never overridden
 */
function shouldApplySandwich(prev, current, next) {
  if (!prev || !current || !next) return false;

  // Respect manual override on middle day
  if (current.isStatusModified) return false;

  // Only WO / HO can be sandwiched
  if (!['WO', 'HO'].includes(current.status)) return false;

  // Half-day protection
  if (prev.status === '½P' || next.status === '½P') return false;

  // Full leave / absent on both sides
  return (
    ['L', 'A'].includes(prev.status) &&
    ['L', 'A'].includes(next.status)
  );
}

/* =========================================================
   CORE SANDWICH APPLICATION
========================================================= */
async function applySandwich(prev, current, next) {
  const now = new Date();

  // 🔥 CURRENT (WO / HO) → A
  if (!current.isStatusModified) {
    current.originalStatus =
      current.originalStatus || current.status;
    current.status = 'A';
    current.isStatusModified = true;
    current.statusChangeReason = 'Sandwich Leave';
    current.statusChangeDate = now;
    await current.save();
  }

  // 🔥 PREVIOUS → A
  if (prev && !prev.isStatusModified) {
    prev.originalStatus = prev.originalStatus || prev.status;
    prev.status = 'A';
    prev.isStatusModified = true;
    prev.statusChangeReason = 'Sandwich Leave';
    prev.statusChangeDate = now;
    await prev.save();
  }

  // 🔥 NEXT → A
  if (next && !next.isStatusModified) {
    next.originalStatus = next.originalStatus || next.status;
    next.status = 'A';
    next.isStatusModified = true;
    next.statusChangeReason = 'Sandwich Leave';
    next.statusChangeDate = now;
    await next.save();
  }
}

/* =========================================================
   SINGLE-DAY SANDWICH EVALUATION
========================================================= */
async function syncAttendanceForDate(date) {
  const d = normalizeDate(date);

  const prevDate = normalizeDate(
    new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  );
  const nextDate = normalizeDate(
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  );

  const todays = await Activity.find({ date: d });
  let sandwichCount = 0;

  for (const current of todays) {
    const empId = current.empId;

    const prev = await Activity.findOne({ empId, date: prevDate });
    const next = await Activity.findOne({ empId, date: nextDate });

    if (shouldApplySandwich(prev, current, next)) {
      await applySandwich(prev, current, next);
      sandwichCount++;
    }
  }

  console.log(
    `[AttendanceSync] ${d.toDateString()} sandwich applied to ${sandwichCount} blocks`
  );

  return {
    success: true,
    date: d,
    sandwichApplied: sandwichCount,
  };
}

/* =========================================================
   RANGE-BASED SANDWICH SYNC
========================================================= */
/**
 * Sandwich MUST be evaluated on:
 * - date - 1
 * - date
 * - date + 1
 */
async function syncAttendanceWithSandwichRange(date) {
  const d = normalizeDate(date);

  const datesToCheck = [
    normalizeDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)),
    d,
    normalizeDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)),
  ];

  for (const checkDate of datesToCheck) {
    await syncAttendanceForDate(checkDate);
  }
}

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  syncAttendanceForDate,
  syncAttendanceWithSandwichRange,
};
