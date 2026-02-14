const { evaluateAttendanceDay } = require('../attendanceLogic');
const {
  normalizeTime,
  timeToSeconds,
  secondsToTime,
} = require('./timeUtils');

/* =========================
   OFFICE TIME CONSTANTS
========================= */
const OFFICE_START = '09:16:00';
const OFFICE_END = '17:30:00';

/* =========================
   MONTH MAP
========================= */
const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/* =========================
   DATE HELPERS (NO UTC EVER)
========================= */
const safeDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
};

// 🔥 Always lock to LOCAL midnight
const normalizeLocalDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// 🔥 Inclusive range check
const isWithinRange = (date, from, to) => {
  if (!date || !from || !to) return false;

  const d = normalizeLocalDate(date).getTime();
  const f = normalizeLocalDate(from).getTime();

  const t = new Date(to);
  t.setHours(23, 59, 59, 999);

  return d >= f && d <= t.getTime();
};

/* =========================
   PAYROLL MONTH (21 → 20)
========================= */
const getPayrollCycleKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // 🔥 Move to cycle start month
  if (d.getDate() < 21) {
    d.setMonth(d.getMonth() - 1);
  }

  // 🔒 Lock cycle to the 21st
  d.setDate(21);

  return d.toISOString().slice(0, 10); // e.g. "2025-10-21"
};


/* =========================
   🔥 DATE CELL PARSER (PATCHED, SAFE)
   Supports:
   - 21-Aug
   - 21 - Aug
   - ignores 21-Thu
========================= */
const parseExcelDateCell = (cell, fromDate, toDate) => {
  if (!cell) return null;

  const text = String(cell).trim();

  // Accept ONLY day-month, ignore day-week
  const match = text.match(/^(\d{1,2})\s*-\s*([A-Za-z]{3})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  const month = monthMap[match[2].toLowerCase()];
  if (month === undefined) return null;

  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  for (const y of [from.getFullYear(), to.getFullYear()]) {
    const d = new Date(y, month, day);
    if (d >= from && d <= to) return d;
  }

  return null;
};

/* =========================
   AUTO TIME CALCULATOR
========================= */
const calculateDayTimes = (inTime, outTime) => {
  const inSec = timeToSeconds(inTime);
  const outSec = timeToSeconds(outTime);
  const startSec = timeToSeconds(OFFICE_START);
  const endSec = timeToSeconds(OFFICE_END);

  let lateBy = '00:00:00';
  let earlyBy = '00:00:00';
  let ot = '00:00:00';
  let duration = '00:00:00';

  if (inSec !== null) {
    if (inSec > startSec) lateBy = secondsToTime(inSec - startSec);
    else if (inSec < startSec) earlyBy = secondsToTime(startSec - inSec);
  }

  if (outSec !== null && outSec > endSec) {
    ot = secondsToTime(outSec - endSec);
  }

  if (inSec !== null && outSec !== null && outSec > inSec) {
    duration = secondsToTime(outSec - inSec);
  }

  return { lateBy, earlyBy, ot, duration };
};

/* =========================
   PAYROLL MONTH (21 → 20)
   USED FOR UI / SUMMARY ONLY
========================= */
const getPayrollMonthFromDate = (date) => {
  let year = date.getFullYear();
  let monthIndex = date.getMonth(); // 0–11

  // Dates 1–20 belong to previous payroll month
  if (date.getDate() < 21) {
    monthIndex -= 1;
    if (monthIndex < 0) {
      monthIndex = 11;
      year -= 1;
    }
  }

  const MONTH_NAMES = [
    'JAN','FEB','MAR','APR','MAY','JUN',
    'JUL','AUG','SEP','OCT','NOV','DEC'
  ];

  return {
    year,
    month: MONTH_NAMES[monthIndex],
  };
};

/* =========================
   🔥 MAIN PROCESSOR (PATCHED, LOGIC PRESERVED)
========================= */
const processExcelRows = (rows, fromDate, toDate) => {
  const activitiesMap = {};
  const payrollCounters = {};

  let employeeCount = 0;
  let currentEmp = null;
  let dates = [];

  console.log(`🧪 TOTAL ROWS FROM PYTHON: ${rows.length}`);
  console.log('📅 RANGE INSIDE PROCESSOR:', {
    from: fromDate?.toDateString?.(),
    to: toDate?.toDateString?.(),
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(v => String(v || '').trim());

    /* =====================================================
       1️⃣ EMPLOYEE HEADER (UNCHANGED, FLOATING CELLS SAFE)
    ===================================================== */
    let empId = '';
    let empName = '';

    for (let j = 0; j < row.length; j++) {
      const cell = row[j]?.toLowerCase().replace(/\s/g, '');

      if (cell.includes('employeecode') || cell.includes('empcode')) {
        for (let k = j + 1; k < row.length; k++) {
          if (row[k]) {
            empId = row[k];
            break;
          }
        }
      }

      if (cell.includes('employeename') || cell === 'name') {
        for (let k = j + 1; k < row.length; k++) {
          if (row[k]) {
            empName = row[k];
            break;
          }
        }
      }
    }

    if (empId && empName) {
      currentEmp = { empId, empName };
      employeeCount++;
      dates = [];
      continue;
    }

    if (!currentEmp) continue;

    /* =====================================================
       2️⃣ DAYS ROW → 21-Aug 22-Aug ...
    ===================================================== */
    if (row[0]?.toLowerCase() === 'days') {
      dates = row
        .slice(1)
        .map(cell => parseExcelDateCell(cell, fromDate, toDate));

      console.log(
        '📅 DATE HEADER LOCKED:',
        dates.filter(Boolean).length
      );
      continue;
    }

    /* =====================================================
       3️⃣ IGNORE WEEKDAY ROW → 21-Thu 22-Fri ...
    ===================================================== */
    if (
      row[0] === '' &&
      row.length > 1 &&
      row.slice(1).every(c => /^\d{1,2}-[A-Za-z]{3}$/.test(c))
    ) {
      // This is ONLY the weekday helper row
      continue;
    }

    /* =====================================================
       4️⃣ DATA ROWS (SHIFT / IN / OUT)
    ===================================================== */
const rawLabel = row[0] || '';
const label = String(rawLabel)
  .toLowerCase()
  .replace(/[:\-_]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

if (!['shift', 'in time', 'out time'].includes(label)) {
  continue;
}

// TEMP DEBUG (remove later)
console.log('📌 ATTENDANCE ROW DETECTED:', label);


    /* =====================================================
       5️⃣ COLUMN ↔ DATE ALIGNMENT (CRITICAL)
    ===================================================== */
    for (let col = 1; col <= dates.length; col++) {
      const date = dates[col - 1];
      if (!date) continue;

      const key = `${currentEmp.empId}_${date.getTime()}`;

      if (!activitiesMap[key]) {
        const { year, month } = getPayrollMonthFromDate(date);
        activitiesMap[key] = {
          empId: currentEmp.empId,
          empName: currentEmp.empName,
          date,
          year,
          month,
          shift: 'GS',
          timeInActual: '00:00:00',
          timeOutActual: '00:00:00',
        };
      }

      if (label === 'shift') {
        activitiesMap[key].shift = row[col] || 'GS';
      }

      if (label === 'in time') {
        activitiesMap[key].timeInActual = normalizeTime(row[col]);
      }

      if (label === 'out time') {
        activitiesMap[key].timeOutActual = normalizeTime(row[col]);
      }
    }
  }

/* =====================================================
   6️⃣ ATTENDANCE CALCULATION (FINAL & CORRECT)
===================================================== */
const activities = Object.values(activitiesMap)
  .sort((a, b) => a.empId.localeCompare(b.empId) || a.date - b.date)
.map(a => {
  const cycleKey = getPayrollCycleKey(a.date);

  // ✅ FIX: counters per EMPLOYEE per PAYROLL CYCLE
  payrollCounters[a.empId] ||= {};
  payrollCounters[a.empId][cycleKey] ||= {
    late: 0,
    permission: 0,
  };

  const counters = payrollCounters[a.empId][cycleKey];

    const isSunday = a.date.getDay() === 0;

    /* =========================
       RUN ATTENDANCE ENGINE
    ========================= */
    const attendance = evaluateAttendanceDay({
      inTime: a.timeInActual,
      outTime: a.timeOutActual,
      isSunday,
      isHoliday: false,
      counters,
    });

    /* =========================
       FINAL STATUS RESOLUTION
       🔥 SOURCE OF TRUTH
    ========================= */
    let status = 'A';

    if (attendance.ho) {
      status = 'HO';
    }
    else if (attendance.wo) {
      status = 'WO';
    }
    else if (attendance.present) {
      status = 'P';
    }
else if (attendance.half) {
  status = '½P';
}


    /* =========================
       APPLY COUNTERS
       ONLY IF FINAL STATUS = P
    ========================= */
    if (status === 'P') {
      if (attendance.lateUsed > 0) {
        counters.late += attendance.lateUsed;
      }
      if (attendance.permissionUsed > 0) {
        counters.permission += attendance.permissionUsed;
      }
    }

    /* =========================
       TIME CALCULATIONS
    ========================= */
    const { lateBy, earlyBy, ot, duration } =
      calculateDayTimes(a.timeInActual, a.timeOutActual);

    return {
      ...a,
      lateBy,
      earlyBy,
      ot,
      duration,
      status,
      originalStatus: status,
      halfDay: status === '½P',
      lateUsed: attendance.lateUsed > 0,
      permissionUsed: attendance.permissionUsed > 0,
    };
  });

console.log('✅ FINAL ACTIVITIES:', activities.length);
console.log('👥 EMPLOYEES PROCESSED:', employeeCount);

return {
  activities,
  employeeCount,
  skippedRows: [],
};

};
module.exports = {
  processExcelRows,
};