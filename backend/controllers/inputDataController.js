const InputData = require('../models/InputData');
const SalaryHistory = require('../models/SalaryHistory');

// ================================
// Helper: Safe number conversion
// ================================
const safeNum = (val) => Math.round(Number(val || 0));


// =======================================
// 🔥 Complete Salary Calculation Logic
// =======================================
const calculateSalaryBreakdown = (actualCTC) => {
  const ctc = safeNum(actualCTC);

  if (!ctc || ctc <= 0) {
    return {
      consileSalary: 0,
      basic: 0,
      hra: 0,
      cca: 0,
      trpAlw: 0,
      oAlw1: 0
    };
  }

  let consileSalary = 0;

  if (ctc < 15285) {
    consileSalary = ctc / 1.1758;
  } else if (ctc >= 15285 && ctc <= 23757) {
    consileSalary = ctc / 1.1638;
  } else if (ctc >= 23758 && ctc <= 34298) {
    consileSalary = ctc / 1.1313;
  } else if (ctc > 34299) {
    consileSalary = (ctc - 1800) / 1.0833;
  }

  consileSalary = Math.round(consileSalary);

  let basic = 0;

  if (consileSalary >= 30000) {
    basic = 15000;
  } else if (consileSalary > 13000 && consileSalary < 30000) {
    basic = consileSalary * 0.4;
  } else if (consileSalary < 13000) {
    basic = consileSalary * 0.5;
  } else if (consileSalary === 13000) {
    basic = 0; // avoid crash, set safe fallback
  }

  basic = Math.round(basic);

  const hra = Math.round(basic * 0.4);
  const cca = 1000;
  const trpAlw = 1600;

  const oAlw1 = Math.round(
    consileSalary - (basic + hra + cca + trpAlw)
  );

  return {
    consileSalary,
    basic,
    hra,
    cca,
    trpAlw,
    oAlw1
  };
};


// ============================================
// ✅ Upload and save unique entries
// ============================================
const uploadInputData = async (req, res) => {
  try {
    const inputArray = req.body;

    if (!Array.isArray(inputArray) || inputArray.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty data array.' });
    }

    const cleanedData = inputArray.map(item => {
      const parsedYear = Number(item.effectiveFromYear);
      const actualCTC = safeNum(item.ActualCTCWithoutLossOfPay);
      const breakdown = calculateSalaryBreakdown(actualCTC);

      return {
        EmpID: item.EmpID?.toString().trim(),
        EmpName: item.EmpName?.toString().trim() || '',

        ActualCTCWithoutLossOfPay: actualCTC,
        CONSILESALARY: breakdown.consileSalary,
        Basic: breakdown.basic,
        HRA: breakdown.hra,
        CCA: breakdown.cca,
        TRP_ALW: breakdown.trpAlw,
        O_ALW1: breakdown.oAlw1,

        PLB: safeNum(item.PLB),
        TDS: safeNum(item.TDS),

        effectiveFromYear: Number.isFinite(parsedYear)
          ? parsedYear
          : new Date().getFullYear(),

        effectiveFromMonth: item.effectiveFromMonth
          ? item.effectiveFromMonth.toString()
          : 'Jan'
      };
    });

    const existing = await InputData.find({}, 'EmpID');
    const existingEmpIDs = new Set(
      existing.map(e => e.EmpID?.toString().trim())
    );

    const newUniqueData = cleanedData.filter(
      row => row.EmpID && !existingEmpIDs.has(row.EmpID)
    );

    if (newUniqueData.length > 0) {
      await InputData.insertMany(newUniqueData);

      for (const row of newUniqueData) {
        const empId = row.EmpID;
        if (!empId) continue;

        const historyExists = await SalaryHistory.findOne({ empId });
        if (historyExists) continue;

        await SalaryHistory.create({
          empId,
          empName: row.EmpName || '',
          actualCTC: row.ActualCTCWithoutLossOfPay,
          consileSalary: row.CONSILESALARY,
          basic: row.Basic,
          hra: row.HRA,
          cca: row.CCA,
          trpAlw: row.TRP_ALW,
          oAlw1: row.O_ALW1,
          effectiveFrom: new Date('2000-01-01'),
          effectiveTo: null,
          updatedBy: 'system',
          reason: 'Initial salary via Excel upload'
        });
      }
    }

    const updatedAll = await InputData.find();
    res.status(200).json(updatedAll);

  } catch (error) {
    console.error('❌ Upload Error:', error.message);
    res.status(500).json({
      message: 'Error saving input data',
      error: error.message
    });
  }
};


// ==========================
// ✅ Get all rows
// ==========================
const getAllInputData = async (req, res) => {
  try {
    const data = await InputData.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch data',
      error: error.message
    });
  }
};


// ==========================
// ✅ Update row
// ==========================
const updateInputDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.effectiveFromYear) {
      updates.effectiveFromYear = Number(updates.effectiveFromYear);
    }

    if (updates.effectiveFromMonth) {
      updates.effectiveFromMonth = updates.effectiveFromMonth.toString();
    }

    if (updates.ActualCTCWithoutLossOfPay !== undefined) {
      updates.ActualCTCWithoutLossOfPay = safeNum(
        updates.ActualCTCWithoutLossOfPay
      );

      const breakdown = calculateSalaryBreakdown(
        updates.ActualCTCWithoutLossOfPay
      );

      updates.CONSILESALARY = breakdown.consileSalary;
      updates.Basic = breakdown.basic;
      updates.HRA = breakdown.hra;
      updates.CCA = breakdown.cca;
      updates.TRP_ALW = breakdown.trpAlw;
      updates.O_ALW1 = breakdown.oAlw1;
    }

    const updated = await InputData.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Input row not found' });
    }

    res.json(updated);

  } catch (err) {
    console.error('❌ Update Error:', err);
    res.status(500).json({
      message: 'Update failed',
      error: err.message
    });
  }
};


// ==========================
// ✅ Delete single row
// ==========================
const deleteInputDataById = async (req, res) => {
  try {
    const deleted = await InputData.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Row not found' });
    }
    res.status(200).json({ message: 'Row deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Delete failed',
      error: error.message
    });
  }
};


// ==========================
// ✅ Delete multiple rows
// ==========================
const deleteManyInputData = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    await InputData.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: 'Selected rows deleted' });

  } catch (err) {
    res.status(500).json({
      message: 'Bulk delete failed',
      error: err.message
    });
  }
};


// ==========================
// ✅ Delete all rows
// ==========================
const deleteAllInputData = async (req, res) => {
  try {
    await InputData.deleteMany({});
    res.status(200).json({ message: 'All rows deleted' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete all',
      error: error.message
    });
  }
};


// ==========================
module.exports = {
  uploadInputData,
  getAllInputData,
  updateInputDataById,
  deleteInputDataById,
  deleteManyInputData,
  deleteAllInputData
};
