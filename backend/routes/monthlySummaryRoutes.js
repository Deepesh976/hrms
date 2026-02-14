const express = require('express');
const router = express.Router();

const MonthlySummary = require('../models/MonthlySummary');
const Activity = require('../models/Activity');

const {
  calculateMonthlySummary,
  saveMonthlySummary,
} = require('../services/activity/monthlySummaryService');

const { protect } = require('../middleware/authMiddleware');

// =========================
// GLOBAL AUTH
// =========================
router.use(protect);

/* =========================================================
   🔥 GET: Monthly summary by employee (CALCULATE ON DEMAND)
   Payroll cycle: 21st → 20th
========================================================= */
router.get('/employee/:empId', async (req, res) => {
  try {
    const { empId } = req.params;
    const { year, month } = req.query;
    const { role, id: userId } = req.user;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year and month are required',
      });
    }

    /* =========================
       🔐 HIERARCHY CHECK
    ========================= */
    if (role === 'hod' || role === 'director') {
      const { getReportingEmployees } = require('../services/hierarchyService');
      const reportingEmployees = await getReportingEmployees(userId, role);
      const allowedEmpIds = reportingEmployees.map(e => e.empId);

      if (!allowedEmpIds.includes(empId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this employee summary',
        });
      }
    }

    const y = Number(year);
    const m = Number(month);

    /* =========================
       🔥 PAYROLL RANGE (21 → 20)
    ========================= */
    const cycleStart = new Date(y, m - 1, 21, 0, 0, 0, 0);
    const cycleEnd = new Date(y, m, 20, 23, 59, 59, 999);

    /* =========================
       FETCH ACTIVITIES
    ========================= */
    const activities = await Activity.find({
      empId,
      date: { $gte: cycleStart, $lte: cycleEnd },
    }).sort({ date: 1 });

    if (!activities.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No activities found for this payroll cycle',
      });
    }

    /* =========================
       🔥 CALCULATE SUMMARY
    ========================= */
    const summary = calculateMonthlySummary(
      empId,
      activities[0].empName,
      activities
    );

    /* =========================
       🔥 SAVE (UPSERT)
    ========================= */
    await saveMonthlySummary(summary);

    /* =========================
       RETURN FINAL SUMMARY
    ========================= */
    const savedSummary = await MonthlySummary.findOne({
      empId,
      year: summary.year,
      month: summary.month,
    });

    res.status(200).json({
      success: true,
      data: [savedSummary],
    });
  } catch (error) {
    console.error('❌ Get Monthly Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly summary',
      error: error.message,
    });
  }
});

/* =========================================================
   GET: All monthly summaries (LIST PAGE / ADMIN)
========================================================= */
router.get('/', async (req, res) => {
  try {
    const { empId, year, month, limit = 50, page = 1 } = req.query;
    const { role, id: userId } = req.user;

    let filter = {};

    /* =========================
       🔐 ROLE FILTER
    ========================= */
    if (role === 'hod' || role === 'director') {
      const { getReportingEmployees } = require('../services/hierarchyService');
      const reportingEmployees = await getReportingEmployees(userId, role);
      const allowedEmpIds = reportingEmployees.map(e => e.empId);

      if (!allowedEmpIds.length) {
        return res.status(200).json({
          success: true,
          count: 0,
          totalCount: 0,
          currentPage: Number(page),
          totalPages: 0,
          data: [],
        });
      }

      filter.empId = { $in: allowedEmpIds };
    }

    if (empId) filter.empId = { $regex: empId, $options: 'i' };
    if (year) filter.year = Number(year);
    if (month) filter.month = Number(month);

    const skip = (Number(page) - 1) * Number(limit);

    const data = await MonthlySummary.find(filter)
      .sort({ year: -1, month: -1, empId: 1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await MonthlySummary.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: data.length,
      totalCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      data,
    });
  } catch (error) {
    console.error('❌ Get All Monthly Summaries Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly summaries',
      error: error.message,
    });
  }
});

/* =========================================================
   DELETE: All summaries of an employee
========================================================= */
router.delete('/employee/:empId', async (req, res) => {
  try {
    const { empId } = req.params;

    const result = await MonthlySummary.deleteMany({ empId });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} summaries deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('❌ Delete Employee Summaries Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting summaries',
      error: error.message,
    });
  }
});

/* =========================================================
   DELETE: Single summary
========================================================= */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MonthlySummary.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Monthly summary not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Monthly summary deleted',
      data: deleted,
    });
  } catch (error) {
    console.error('❌ Delete Monthly Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting summary',
      error: error.message,
    });
  }
});

/* =========================================================
   GET: Stats
========================================================= */
router.get('/stats', async (req, res) => {
  try {
    const totalSummaries = await MonthlySummary.countDocuments();
    const employees = await MonthlySummary.distinct('empId');
    const years = await MonthlySummary.distinct('year');

    res.status(200).json({
      success: true,
      data: {
        totalSummaries,
        uniqueEmployees: employees.length,
        employees,
        years: years.sort((a, b) => b - a),
      },
    });
  } catch (error) {
    console.error('❌ Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats',
      error: error.message,
    });
  }
});

module.exports = router;
