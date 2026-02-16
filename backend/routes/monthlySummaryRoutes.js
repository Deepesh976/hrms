const express = require('express');
const router = express.Router();

const MonthlySummary = require('../models/MonthlySummary');
const Activity = require('../models/Activity');

const {
  calculateMonthlySummary,
  saveMonthlySummary,
} = require('../services/activity/monthlySummaryService');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

/* =========================================================
   🔥 GET: Monthly summary by employee
   ✔ First checks DB
   ✔ Only recalculates if NOT found
   ✔ Prevents empty-activity false negatives
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

    const y = Number(year);
    const m = Number(month);

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

    /* =========================
       🔥 STEP 1: CHECK IF ALREADY EXISTS
    ========================= */
    let existingSummary = await MonthlySummary.findOne({
      empId,
      year: y,
      month: m,
    });

    if (existingSummary) {
      return res.status(200).json({
        success: true,
        data: existingSummary,
      });
    }

    /* =========================
       🔥 STEP 2: CALCULATE IF NOT FOUND
    ========================= */

    // Payroll cycle 21 → 20
    const cycleStart = new Date(y, m - 1, 21, 0, 0, 0, 0);
    const cycleEnd = new Date(y, m, 20, 23, 59, 59, 999);

    const activities = await Activity.find({
      empId,
      date: { $gte: cycleStart, $lte: cycleEnd },
    }).sort({ date: 1 });

    if (!activities.length) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No activities found for this payroll cycle',
      });
    }

    const summary = calculateMonthlySummary(
      empId,
      activities[0].empName,
      activities
    );

    await saveMonthlySummary(summary);

    const savedSummary = await MonthlySummary.findOne({
      empId,
      year: summary.year,
      month: summary.month,
    });

    return res.status(200).json({
      success: true,
      data: savedSummary,
    });

  } catch (error) {
    console.error('❌ Get Monthly Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly summary',
    });
  }
});

/* =========================================================
   GET: All monthly summaries
========================================================= */
router.get('/', async (req, res) => {
  try {
    const { empId, year, month, limit = 50, page = 1 } = req.query;
    const { role, id: userId } = req.user;

    let filter = {};

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
    });
  }
});

module.exports = router;
