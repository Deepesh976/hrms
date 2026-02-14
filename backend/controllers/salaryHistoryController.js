const SalaryHistory = require('../models/SalaryHistory');
const InputData = require('../models/InputData');

// Helper: Safe number conversion
const safeNum = (val) => Math.round(Number(val || 0));

// ======================================
// ✅ GET salary history by employee ID
// ======================================
const getSalaryHistoryByEmpId = async (req, res) => {
  try {
    const { empId } = req.params;

    if (!empId) {
      return res.status(400).json({
        message: 'empId is required'
      });
    }

    const history = await SalaryHistory.find({ empId })
      .sort({ effectiveFrom: -1 }); // Newest first for UI

    res.status(200).json(history);

  } catch (err) {
    console.error('❌ History Fetch Error:', err);
    res.status(500).json({
      message: 'Failed to fetch salary history',
      error: err.message
    });
  }
};

// ======================================
// ✅ ADD new salary revision
// ======================================
const addSalaryRevision = async (req, res) => {
  try {
    const { empId } = req.params;
    const {
      actualCTC,
      consileSalary,
      basic,
      hra,
      cca,
      trpAlw,
      oAlw1,
      effectiveFromYear,
      effectiveFromMonth,
      reason,
      updatedBy
    } = req.body;

    if (!empId || !actualCTC || !effectiveFromYear || !effectiveFromMonth) {
      return res.status(400).json({
        message: 'empId, actualCTC, effectiveFromYear, and effectiveFromMonth are required'
      });
    }

    // Convert month name to date
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const monthIndex = monthMap[effectiveFromMonth] ?? 0;
    const effectiveFrom = new Date(effectiveFromYear, monthIndex, 1);

    // Check if entry for same effective date already exists
    const existingEntry = await SalaryHistory.findOne({
      empId,
      effectiveFrom
    });

    if (existingEntry) {
      return res.status(400).json({
        message: `Salary entry for ${effectiveFromMonth} ${effectiveFromYear} already exists`
      });
    }

    // Close the previous active entry
    const previousActive = await SalaryHistory.findOne({
      empId,
      effectiveTo: null
    });

    if (previousActive) {
      // Set effectiveTo to 1 day before new effectiveFrom
      const previousEffectiveTo = new Date(effectiveFrom);
      previousEffectiveTo.setDate(previousEffectiveTo.getDate() - 1);
      previousActive.effectiveTo = previousEffectiveTo;
      await previousActive.save();
    }

    // Get employee name from InputData
    const inputData = await InputData.findOne({ EmpID: empId });
    const empName = inputData?.EmpName || '';

    // Create new salary history entry
    const newEntry = await SalaryHistory.create({
      empId,
      empName,
      actualCTC: safeNum(actualCTC),
      consileSalary: safeNum(consileSalary),
      basic: safeNum(basic),
      hra: safeNum(hra),
      cca: safeNum(cca),
      trpAlw: safeNum(trpAlw),
      oAlw1: safeNum(oAlw1),
      effectiveFrom,
      effectiveTo: null, // Active entry
      updatedBy: updatedBy || 'admin',
      reason: reason || 'Salary revision'
    });

    // Also update InputData with latest salary
    if (inputData) {
      inputData.ActualCTCWithoutLossOfPay = safeNum(actualCTC);
      inputData.CONSILESALARY = safeNum(consileSalary);
      inputData.Basic = safeNum(basic);
      inputData.HRA = safeNum(hra);
      inputData.CCA = safeNum(cca);
      inputData.TRP_ALW = safeNum(trpAlw);
      inputData.O_ALW1 = safeNum(oAlw1);
      inputData.effectiveFromYear = effectiveFromYear;
      inputData.effectiveFromMonth = effectiveFromMonth;
      await inputData.save();
    }

    // Return updated history
    const history = await SalaryHistory.find({ empId })
      .sort({ effectiveFrom: -1 });

    res.status(201).json({
      message: 'Salary revision added successfully',
      newEntry,
      history
    });

  } catch (err) {
    console.error('❌ Add Revision Error:', err);
    res.status(500).json({
      message: 'Failed to add salary revision',
      error: err.message
    });
  }
};

// ======================================
// ✅ UPDATE salary history entry
// ======================================
const updateSalaryHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const updates = req.body;

    const entry = await SalaryHistory.findById(historyId);
    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'actualCTC', 'consileSalary', 'basic', 'hra', 'cca', 'trpAlw', 'oAlw1', 'reason'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        entry[field] = safeNum(updates[field]);
      }
    });

    if (updates.reason) {
      entry.reason = updates.reason;
    }

    await entry.save();

    // If this is the active entry, also update InputData
    if (entry.effectiveTo === null) {
      const inputData = await InputData.findOne({ EmpID: entry.empId });
      if (inputData) {
        inputData.ActualCTCWithoutLossOfPay = entry.actualCTC;
        inputData.CONSILESALARY = entry.consileSalary;
        inputData.Basic = entry.basic;
        inputData.HRA = entry.hra;
        inputData.CCA = entry.cca;
        inputData.TRP_ALW = entry.trpAlw;
        inputData.O_ALW1 = entry.oAlw1;
        await inputData.save();
      }
    }

    res.status(200).json({
      message: 'Salary history updated',
      entry
    });

  } catch (err) {
    console.error('❌ Update History Error:', err);
    res.status(500).json({
      message: 'Failed to update salary history',
      error: err.message
    });
  }
};

// ======================================
// ✅ DELETE salary history entry
// ======================================
const deleteSalaryHistory = async (req, res) => {
  try {
    const { historyId } = req.params;

    const entry = await SalaryHistory.findById(historyId);
    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    const empId = entry.empId;

    // Count total entries for this employee
    const totalEntries = await SalaryHistory.countDocuments({ empId });

    if (totalEntries === 1) {
      return res.status(400).json({
        message: 'Cannot delete the only salary entry. At least one entry must remain.'
      });
    }

    // If deleting the active entry, reactivate the previous one
    if (entry.effectiveTo === null) {
      // Find the second most recent entry
      const previousEntry = await SalaryHistory.findOne({
        empId,
        _id: { $ne: entry._id }
      }).sort({ effectiveFrom: -1 });

      if (previousEntry) {
        previousEntry.effectiveTo = null;
        await previousEntry.save();

        // Update InputData with previous entry's values
        const inputData = await InputData.findOne({ EmpID: empId });
        if (inputData) {
          inputData.ActualCTCWithoutLossOfPay = previousEntry.actualCTC;
          inputData.CONSILESALARY = previousEntry.consileSalary;
          inputData.Basic = previousEntry.basic;
          inputData.HRA = previousEntry.hra;
          inputData.CCA = previousEntry.cca;
          inputData.TRP_ALW = previousEntry.trpAlw;
          inputData.O_ALW1 = previousEntry.oAlw1;

          // Convert effectiveFrom to month/year
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          inputData.effectiveFromMonth = months[previousEntry.effectiveFrom.getMonth()];
          inputData.effectiveFromYear = previousEntry.effectiveFrom.getFullYear();
          await inputData.save();
        }
      }
    }

    await SalaryHistory.findByIdAndDelete(historyId);

    // Return updated history
    const history = await SalaryHistory.find({ empId })
      .sort({ effectiveFrom: -1 });

    res.status(200).json({
      message: 'Salary entry deleted',
      history
    });

  } catch (err) {
    console.error('❌ Delete History Error:', err);
    res.status(500).json({
      message: 'Failed to delete salary history',
      error: err.message
    });
  }
};

module.exports = {
  getSalaryHistoryByEmpId,
  addSalaryRevision,
  updateSalaryHistory,
  deleteSalaryHistory
};