const SalaryHistory = require('../models/SalaryHistory');
const InputData = require('../models/InputData');
const Salary = require('../models/Salary'); // 🔥 Added

// Helper: Safe number conversion
const safeNum = (val) => Math.round(Number(val || 0));

/* =====================================================
   🔥 AUTO BREAKDOWN CALCULATOR (CTC → COMPONENTS)
===================================================== */
const calculateSalaryBreakdown = (actualCTC) => {
  const ctc = safeNum(actualCTC);

  let consileSalary = 0;

  if (ctc < 15285) {
    consileSalary = ctc / 1.1758;
  } else if (ctc <= 23757) {
    consileSalary = ctc / 1.1638;
  } else if (ctc <= 34298) {
    consileSalary = ctc / 1.1313;
  } else {
    consileSalary = (ctc - 1800) / 1.0833;
  }

  consileSalary = Math.round(consileSalary);

  let basic =
    consileSalary >= 30000
      ? 15000
      : consileSalary > 13000
        ? consileSalary * 0.4
        : consileSalary * 0.5;

  basic = Math.round(basic);

  const hra = Math.round(basic * 0.4);
  const cca = 1000;
  const trpAlw = 1600;

  const oAlw1 = Math.round(
    consileSalary - (basic + hra + cca + trpAlw)
  );

  return { consileSalary, basic, hra, cca, trpAlw, oAlw1 };
};

/* =====================================================
   ✅ GET SALARY HISTORY
===================================================== */
const getSalaryHistoryByEmpId = async (req, res) => {
  try {
    const { empId } = req.params;

    if (!empId) {
      return res.status(400).json({ message: 'empId is required' });
    }

    const history = await SalaryHistory.find({ empId })
      .sort({ effectiveFrom: -1 });

    res.status(200).json(history);

  } catch (err) {
    console.error('❌ History Fetch Error:', err);
    res.status(500).json({
      message: 'Failed to fetch salary history',
      error: err.message
    });
  }
};

/* =====================================================
   ✅ ADD NEW SALARY REVISION
===================================================== */
const addSalaryRevision = async (req, res) => {
  try {
    const { empId } = req.params;
    const {
      actualCTC,
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

    // 🔥 Month mapping
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const monthIndex = monthMap[effectiveFromMonth];
    if (monthIndex === undefined) {
      return res.status(400).json({ message: 'Invalid effectiveFromMonth' });
    }

    const effectiveFrom = new Date(effectiveFromYear, monthIndex, 1);

    // 🔥 Prevent duplicate effective date
    const duplicate = await SalaryHistory.findOne({ empId, effectiveFrom });
    if (duplicate) {
      return res.status(400).json({
        message: `Salary entry for ${effectiveFromMonth} ${effectiveFromYear} already exists`
      });
    }

    // 🔥 Close previous active entry
    const previousActive = await SalaryHistory.findOne({
      empId,
      effectiveTo: null
    });

    if (previousActive) {
      const previousEffectiveTo = new Date(effectiveFrom);
      previousEffectiveTo.setDate(previousEffectiveTo.getDate() - 1);
      previousActive.effectiveTo = previousEffectiveTo;
      await previousActive.save();
    }

    // 🔥 Auto calculate breakdown
    const breakdown = calculateSalaryBreakdown(actualCTC);

    const inputData = await InputData.findOne({ EmpID: empId });
    const empName = inputData?.EmpName || '';

    // 🔥 Create new salary history entry
    const newEntry = await SalaryHistory.create({
      empId,
      empName,
      actualCTC: safeNum(actualCTC),
      consileSalary: breakdown.consileSalary,
      basic: breakdown.basic,
      hra: breakdown.hra,
      cca: breakdown.cca,
      trpAlw: breakdown.trpAlw,
      oAlw1: breakdown.oAlw1,
      effectiveFrom,
      effectiveTo: null,
      updatedBy: updatedBy || 'admin',
      reason: reason || 'Salary revision'
    });

    // 🔥 Delete future salary rows (timeline safe)
    await Salary.deleteMany({
      empId,
      $or: [
        { year: { $gt: effectiveFromYear } },
        {
          year: effectiveFromYear,
          monthNumber: { $gte: monthIndex + 1 }
        }
      ]
    });

    // 🔥 Update InputData (latest snapshot only)
    if (inputData) {
      inputData.ActualCTCWithoutLossOfPay = safeNum(actualCTC);
      inputData.CONSILESALARY = breakdown.consileSalary;
      inputData.Basic = breakdown.basic;
      inputData.HRA = breakdown.hra;
      inputData.CCA = breakdown.cca;
      inputData.TRP_ALW = breakdown.trpAlw;
      inputData.O_ALW1 = breakdown.oAlw1;
      inputData.effectiveFromYear = effectiveFromYear;
      inputData.effectiveFromMonth = effectiveFromMonth;
      await inputData.save();
    }

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

/* =====================================================
   ✅ UPDATE SALARY HISTORY ENTRY
===================================================== */
const updateSalaryHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const { actualCTC, reason } = req.body;

    const entry = await SalaryHistory.findById(historyId);
    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    if (actualCTC !== undefined) {
      const breakdown = calculateSalaryBreakdown(actualCTC);
      entry.actualCTC = safeNum(actualCTC);
      entry.consileSalary = breakdown.consileSalary;
      entry.basic = breakdown.basic;
      entry.hra = breakdown.hra;
      entry.cca = breakdown.cca;
      entry.trpAlw = breakdown.trpAlw;
      entry.oAlw1 = breakdown.oAlw1;
    }

    if (reason) entry.reason = reason;

    await entry.save();

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

/* =====================================================
   ✅ DELETE SALARY HISTORY ENTRY
===================================================== */
const deleteSalaryHistory = async (req, res) => {
  try {
    const { historyId } = req.params;

    const entry = await SalaryHistory.findById(historyId);
    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    const empId = entry.empId;

    const totalEntries = await SalaryHistory.countDocuments({ empId });
    if (totalEntries === 1) {
      return res.status(400).json({
        message: 'Cannot delete the only salary entry.'
      });
    }

    await SalaryHistory.findByIdAndDelete(historyId);

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

const repairAllSalaryHistory = async (req, res) => {
  try {
    const histories = await SalaryHistory.find({});

    let count = 0;

    for (const entry of histories) {
      if (!entry.consileSalary || entry.consileSalary === 0) {

        const breakdown = calculateSalaryBreakdown(entry.actualCTC);

        entry.consileSalary = breakdown.consileSalary;
        entry.basic = breakdown.basic;
        entry.hra = breakdown.hra;
        entry.cca = breakdown.cca;
        entry.trpAlw = breakdown.trpAlw;
        entry.oAlw1 = breakdown.oAlw1;

        await entry.save();
        count++;
      }
    }

    res.json({ message: `${count} records repaired successfully` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSalaryHistoryByEmpId,
  addSalaryRevision,
  updateSalaryHistory,
  deleteSalaryHistory,
  repairAllSalaryHistory
};
