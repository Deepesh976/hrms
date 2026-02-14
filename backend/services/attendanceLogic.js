// services/activity/attendanceLogic.js

/* =========================
   CONSTANTS (SECONDS)
========================= */
const TIMES = {
  T_09_16: 9 * 3600 + 16 * 60,        // 09:16
  T_09_30: 9 * 3600 + 30 * 60,        // 09:30
  T_11_00: 11 * 3600,                // 11:00
  T_13_00: 13 * 3600,                // 13:00
  T_15_30: 15 * 3600 + 30 * 60,      // 15:30
  T_17_30: 17 * 3600 + 30 * 60,      // 17:30
};

const LIMITS = {
  LATE: 3,
  PERMISSION: 2,
};

/* =========================
   HELPERS
========================= */
const timeToSeconds = (t) => {
  if (!t || t === '00:00' || t === '00:00:00') return null;
  const [h, m, s = 0] = t.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

/* =========================
   CORE ENGINE (FINAL – HR CORRECT)
========================= */
/**
 * RULES GUARANTEED
 * ----------------
 * ✔ Late allowed = 3
 * ✔ Permission allowed = 2
 * ✔ Late window: 09:16:01 – 11:00
 * ✔ Early window: 15:30:01 – 17:29
 * ✔ Late + Early = 2 permissions
 * ✔ If permissions insufficient → ½P
 * ✔ <11:00 IN → never auto ½P
 * ✔ >11:00 IN → ½P
 * ✔ <15:30 OUT → ½P
 * ✔ Counters are READ-ONLY (snapshot)
 * ✔ Counters are updated OUTSIDE
 */
function evaluateAttendanceDay({
  inTime,
  outTime,
  isSunday = false,
  isHoliday = false,
  counters = { late: 0, permission: 0 },
}) {
  const decision = {
    present: false,
    half: false,
    absent: false,
    wo: false,
    ho: false,
    lateUsed: 0,
    permissionUsed: 0,
  };

  /* =========================
     STEP 1: HOLIDAY / WEEK OFF
  ========================= */
  if (isHoliday) {
    decision.ho = true;
    return decision;
  }

  if (isSunday) {
    decision.wo = true;
    return decision;
  }

  const inS = timeToSeconds(inTime);
  const outS = timeToSeconds(outTime);

  /* =========================
     STEP 2: NO CHECK-IN
  ========================= */
  if (inS === null) {
    decision.absent = true;
    return decision;
  }

  /* =========================
     STEP 3: IN-TIME RULES
     (NO HALF DAY HERE)
  ========================= */

  // ✅ On time / grace
  if (inS <= TIMES.T_09_16) {
    decision.present = true;
  }

  // 🟡 Late window (09:16:01 – 09:30)
  else if (inS <= TIMES.T_09_30) {
    decision.present = true;

    if (counters.late < LIMITS.LATE) {
      decision.lateUsed = 1;
    } else if (counters.permission < LIMITS.PERMISSION) {
      decision.permissionUsed = 1;
    }
  }

  // 🟡 Permission window (09:30:01 – 11:00)
  else if (inS <= TIMES.T_11_00) {
    decision.present = true;

    if (counters.permission < LIMITS.PERMISSION) {
      decision.permissionUsed = 1;
    }
  }

  // 🟠 Half day (11:00:01 – 13:00)
  else if (inS <= TIMES.T_13_00) {
    decision.half = true;
    return decision;
  }

  // 🔴 Absent (>13:00)
  else {
    decision.absent = true;
    return decision;
  }

  /* =========================
     STEP 4: SHORT CIRCUIT
  ========================= */
  if (!decision.present || outS === null) {
    return decision;
  }

  /* =========================
     STEP 5: OUT-TIME RULES
     (THIS decides FULL vs HALF)
  ========================= */

  const totalPermissionsUsed =
    counters.permission + decision.permissionUsed;

  // ✅ Full day
  if (outS >= TIMES.T_17_30) {
    return decision;
  }

  // 🟡 Early exit (15:30:01 – 17:29)
  if (outS >= TIMES.T_15_30) {
    if (totalPermissionsUsed < LIMITS.PERMISSION) {
      decision.permissionUsed += 1; // 🔥 second permission
      return decision; // still PRESENT
    }

    decision.present = false;
    decision.half = true;
    return decision;
  }

  // 🟠 Very early exit (<15:30) → HALF DAY
  decision.present = false;
  decision.half = true;
  return decision;
}

module.exports = {
  evaluateAttendanceDay,
};
