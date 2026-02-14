const Activity = require('../models/Activity');
const MonthlySummary = require('../models/MonthlySummary');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const { processExcelRows } = require('../services/activity/activityExcelService');
const { generateSalaryRecords } = require('../services/activity/salaryService');
const { normalizeTime } = require('../services/activity/timeUtils');

const LeaveCalendar = require('../models/LeaveCalendar');
const { recalculateActivityForDate } = require('../services/holidayImpactService');

const {
  calculateMonthlySummary,
  saveMonthlySummary,
} = require('../services/activity/monthlySummaryService');

const {
  generateMonthlySummaryForCycle,
} = require('../services/activity/monthlySummaryBatchService');


/* ======================================================
   CONSTANTS
====================================================== */
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';

const ALLOWED_STATUSES = ['P', '½P', 'A', 'WO', 'HO', 'L'];

const EDIT_ROLES = [
  'admin',
  'hrms_handler',
  'super_admin',
  'superadmin',
];

/* ======================================================
   HELPERS
====================================================== */
const normalizeLocalDate = (d) => {
  const date = new Date(d);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  );
};

/* ======================================================
   PYTHON EXCEL CLEANER
====================================================== */
const runPythonExcelCleaner = (fileBuffer, originalName) =>
  new Promise((resolve, reject) => {
    try {
      const tmpDir = path.join(__dirname, '..', 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const ext = path.extname(originalName || '').toLowerCase();
      if (!['.xls', '.xlsx'].includes(ext)) {
        return reject(new Error('Only .xls and .xlsx files supported'));
      }

      const ts = Date.now();
      const inputPath = path.join(tmpDir, `input_${ts}${ext}`);
      const outputPath = path.join(tmpDir, `output_${ts}.xlsx`);
      const scriptPath = path.join(__dirname, '..', 'cleaner', 'src', 'script.py');

      fs.writeFileSync(inputPath, fileBuffer);

      execFile(PYTHON_BIN, [scriptPath, inputPath, outputPath], (err) => {
        if (err) return reject(err);

        const workbook = XLSX.readFile(outputPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        resolve(rows);
      });
    } catch (err) {
      reject(err);
    }
  });

/* ======================================================
   🔥 UPLOAD EXCEL (FINAL, PAYROLL-SAFE)
====================================================== */
const uploadActivityExcel = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded' });
    }

    const { fromDate, toDate } = req.uploadRange || {};
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing FROM / TO range' });
    }

    const fromNorm = normalizeLocalDate(fromDate);
    const toNorm = normalizeLocalDate(toDate);

    /* ======================================================
       1️⃣ DELETE OLD ACTIVITY (ONLY THIS RANGE)
    ====================================================== */
    await Activity.deleteMany({
      date: { $gte: fromNorm, $lte: toNorm },
    });

    /* ======================================================
       2️⃣ CLEAN EXCEL USING PYTHON
    ====================================================== */
    const rows = await runPythonExcelCleaner(
      req.file.buffer,
      req.file.originalname
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Excel empty after cleaning',
      });
    }

    /* ======================================================
       3️⃣ PARSE EXCEL → ATTENDANCE ENGINE
    ====================================================== */
    const {
      activities = [],
      employeeCount = 0,
      skippedRows = [],
    } = processExcelRows(rows, fromNorm, toNorm);

    if (!activities.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid attendance rows found',
        employeeCount,
        skippedRows,
      });
    }

    /* ======================================================
       4️⃣ NORMALIZE FOR DB
    ====================================================== */
    const normalizedActivities = activities
      .map((a) => {
        if (!a?.date) return null;

        const cleanDate = normalizeLocalDate(a.date);
        if (cleanDate < fromNorm || cleanDate > toNorm) return null;

        let status = a.status || 'A';
        if (
          ['HALF', 'HALF DAY', 'H', '0.5'].includes(
            String(status).toUpperCase()
          )
        ) {
          status = '½P';
        }

return {
  empId: String(a.empId).trim(),
  empName: String(a.empName).trim(),
  date: cleanDate,
  shift: a.shift || 'GS',
  status,

  // 🔥 ADD THESE TWO LINES
  isStatusModified: false,     // system-generated
  originalStatus: null,        // no manual override yet

  timeInActual: normalizeTime(a.timeInActual),
  timeOutActual: normalizeTime(a.timeOutActual),
  lateBy: normalizeTime(a.lateBy),
  earlyBy: normalizeTime(a.earlyBy),
  ot: normalizeTime(a.ot),
  duration: normalizeTime(a.duration),
};

      })
      .filter(Boolean);

    /* ======================================================
       5️⃣ INSERT ACTIVITIES
    ====================================================== */
    await Activity.insertMany(normalizedActivities, { ordered: false });

    /* ======================================================
   🔥 FORCE HOLIDAY OVERRIDE FOR UPLOADED RANGE
====================================================== */
const holidays = await LeaveCalendar.find({
  date: { $gte: fromNorm, $lte: toNorm }
});

for (const holiday of holidays) {
  await recalculateActivityForDate(holiday.date, holiday.title);
}


/* ======================================================
   6️⃣ MONTHLY SUMMARY (FULL PAYROLL CYCLE – FIXED)
   🔥 DB IS SOURCE OF TRUTH
====================================================== */

// Use TO date as payroll anchor (21 → 20 handled inside service)
await generateMonthlySummaryForCycle(toNorm);


/* ======================================================
   ✅ RESPONSE (ONLY ONCE)
====================================================== */
return res.status(200).json({
  success: true,
  message: 'Attendance & monthly summary generated',
  employeeCount,
  activityCount: normalizedActivities.length,
  skippedRows,
});


  } catch (err) {
    console.error('❌ uploadActivityExcel error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ======================================================
   🔥 UPDATE ACTIVITY STATUS (CONTROLLED)
====================================================== */
const updateActivityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, changeReason } = req.body;

    const role = req.user?.role?.toLowerCase();
    if (!EDIT_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit attendance',
      });
    }

    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status',
      });
    }

    if (!changeReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Change reason is mandatory',
      });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    /* 🔥 STORE ORIGINAL ONLY ONCE */
    if (!activity.isStatusModified) {
      activity.originalStatus = activity.status;
    }

    activity.status = newStatus;
    activity.statusChangeReason = changeReason.trim();
    activity.statusChangedBy = req.user?.id || 'system';
    activity.statusChangeDate = new Date();
    activity.isStatusModified = true;

    await activity.save();

    /* ======================================================
       🔥 REGENERATE MONTHLY SUMMARY (ATTENDANCE ONLY)
       ❌ NO SALARY GENERATION HERE
    ====================================================== */
    const activities = await Activity.find({
      empId: activity.empId,
    }).sort({ date: 1 });

    const summaries = calculateMonthlySummary(
      activity.empId,
      activity.empName,
      activities
    );

    if (Array.isArray(summaries) && summaries.length) {
      for (const summary of summaries) {
        await saveMonthlySummary(summary);
      }
    }

    return res.json({
      success: true,
      message: 'Status updated & monthly summary refreshed',
      activity,
    });
  } catch (err) {
    console.error('❌ updateActivityStatus error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ======================================================
   UPLOAD JSON (UNCHANGED)
====================================================== */
const uploadActivityData = async (req, res) => {
  try {
    const { activities } = req.body;
    if (!Array.isArray(activities) || !activities.length) {
      return res.status(400).json({ success: false, message: 'No activity data provided' });
    }

    const normalizedActivities = activities.map((a) => ({
      ...a,
      empId: String(a.empId).trim(),
      empName: String(a.empName).trim(),
      date: normalizeLocalDate(a.date),
      timeInActual: normalizeTime(a.timeInActual),
      timeOutActual: normalizeTime(a.timeOutActual),
      lateBy: normalizeTime(a.lateBy),
      earlyBy: normalizeTime(a.earlyBy),
      ot: normalizeTime(a.ot),
      duration: normalizeTime(a.duration),
    }));

    await Activity.insertMany(normalizedActivities);

    res.status(200).json({
      success: true,
      message: 'Activity data uploaded',
      count: normalizedActivities.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   GET ALL ACTIVITIES (READ-ONLY)
   🔥 ACCESS CONTROL HANDLED BY authorizeDepartment
====================================================== */
const getAllActivities = async (req, res) => {
  try {
    /**
     * IMPORTANT:
     * - Do NOT rebuild role logic here
     * - Middleware (authorizeDepartment) already applied hierarchy filter
     * - Controller must blindly trust req.activityFilter
     */
    const filter = req.activityFilter || {};

    const activities = await Activity.find(filter)
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      activities,
    });
  } catch (err) {
    console.error('❌ getAllActivities error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};




/* ======================================================
   DELETE ALL (ADMIN ONLY)
====================================================== */
const deleteAllActivities = async (req, res) => {
  await Activity.deleteMany({});
  await MonthlySummary.deleteMany({});

  const salaryRegenerated = await generateSalaryRecords();

  res.json({
    success: true,
    salaryRegenerated,
  });
};

/* ======================================================
   🔥 DELETE ACTIVITIES BY DATE RANGE (SAFE)
====================================================== */
const deleteActivitiesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, empId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const from = normalizeLocalDate(startDate);
    const to = normalizeLocalDate(endDate);

    const filter = {
      date: { $gte: from, $lte: to },
    };

    if (empId) {
      filter.empId = empId;
    }

    const result = await Activity.deleteMany(filter);

    return res.status(200).json({
      success: true,
      message: 'Filtered attendance deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('❌ deleteActivitiesByDateRange error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  uploadActivityExcel,
  uploadActivityData,
  getAllActivities,
  deleteAllActivities,
  deleteActivitiesByDateRange,
  updateActivityStatus,
};
