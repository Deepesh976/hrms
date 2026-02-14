const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const InputData = require('../models/InputData');
const MonthlySummary = require('../models/MonthlySummary');
const SalaryHistory = require('../models/SalaryHistory');
const XLSX = require('xlsx');
const { generateSalaryRecords } = require('../services/salaryService');

// ================================
// Helpers
// ================================
const safe = (val) => (isNaN(val) ? 0 : Number(val));
const safeNum = (val) => Math.round(Number(val || 0));

const MONTH_MAP = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// ================================
// Month Normalizer
// ================================
const normalizeMonth = (m) => {
  if (!m) return null;

  const map = {
    january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr',
    may: 'May', june: 'Jun', july: 'Jul', august: 'Aug',
    september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec'
  };

  const key = m.toString().trim().toLowerCase();
  return map[key] || m.toString().slice(0, 3);
};

// ================================
// Get Effective Salary from History
// ================================
/**
 * Get effective salary components for a specific month/year from SalaryHistory
 * @param {string} empId - Employee ID
 * @param {number} year - Year
 * @param {string} monthName - Month name (Jan, Feb, etc.)
 * @returns {Object|null} - All salary components or null
 */
const getSalaryForMonth = async (empId, year, monthName) => {
  const normalized = normalizeMonth(monthName);
  const monthIndex = MONTH_MAP.indexOf(normalized);
  if (monthIndex === -1) return null;

  const fromDate = new Date(Date.UTC(year, monthIndex, 1));
  const toDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

  const history = await SalaryHistory.find({
    empId,
    effectiveFrom: { $lte: toDate },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: fromDate } }
    ]
  }).sort({ effectiveFrom: -1 });

  if (!history.length) return null;

  const entry = history[0];
  return {
    actualCTC: entry.actualCTC,
    consileSalary: entry.consileSalary,
    basic: entry.basic,
    hra: entry.hra,
    cca: entry.cca,
    trpAlw: entry.trpAlw,
    oAlw1: entry.oAlw1,
    effectiveFrom: entry.effectiveFrom
  };
};

// Legacy alias for backward compatibility
const getCTCForMonth = async (empId, year, monthName) => {
  const salary = await getSalaryForMonth(empId, year, monthName);
  return salary ? salary.actualCTC : null;
};



// ============================================
// Helper: Detect manual override vs computed
// ============================================
const isManuallyProvided = (newVal, existingVal) => {
  if (newVal === null || newVal === undefined || newVal === '') return false;
  if (existingVal === null || existingVal === undefined || existingVal === '')
    return newVal !== 0;
  return Number(newVal) !== Number(existingVal);
};

// ============================================
// Salary Component Calculator
// ============================================
const computeDerivedFields = (data, existingData = {}) => {
  const totalDays = safe(data.totalDays);

  // 🔥 TRUST GENERATED VALUES (HALF-DAY SAFE)
  const daysPaid = isManuallyProvided(data.daysPaid, existingData.daysPaid)
    ? safe(data.daysPaid)
    : safe(data.daysPaid ?? data.daysWorked);

  const lop = isManuallyProvided(data.lop, existingData.lop)
    ? safe(data.lop)
    : Math.max(totalDays - daysPaid, 0);

  /* =========================
     SALARY CALC CONTINUES
  ========================= */

  const consileSalary = safe(data.consileSalary);
  const basic = safe(data.basic);
  const hra = safe(data.hra);
  const cca = safe(data.cca);
  const trp = safe(data.transportAllowance);
  const oalw = safe(data.otherAllowance1);
  const plb = safe(data.plb);
  const tds = safe(data.tds);

  const lop2 = isManuallyProvided(data.lop2, existingData.lop2)
    ? safe(data.lop2)
    : totalDays
      ? (consileSalary / totalDays) * lop
      : 0;

  const basic3 = isManuallyProvided(data.basic3, existingData.basic3)
    ? safe(data.basic3)
    : totalDays
      ? (basic / totalDays) * daysPaid
      : 0;

  const hra4 = isManuallyProvided(data.hra4, existingData.hra4)
    ? safe(data.hra4)
    : totalDays
      ? (hra / totalDays) * daysPaid
      : 0;

  const cca5 = isManuallyProvided(data.cca5, existingData.cca5)
    ? safe(data.cca5)
    : totalDays
      ? (cca / totalDays) * daysPaid
      : 0;

  const trp6 = isManuallyProvided(
    data.transportAllowance6,
    existingData.transportAllowance6
  )
    ? safe(data.transportAllowance6)
    : totalDays
      ? (trp / totalDays) * daysPaid
      : 0;

  const oalw17 = isManuallyProvided(
    data.otherAllowance17,
    existingData.otherAllowance17
  )
    ? safe(data.otherAllowance17)
    : totalDays
      ? (oalw / totalDays) * daysPaid
      : 0;

  const grossPay = isManuallyProvided(data.grossPay, existingData.grossPay)
    ? safe(data.grossPay)
    : basic3 + hra4 + cca5 + trp6 + oalw17;

  let esi = 0;
  if (isManuallyProvided(data.esi, existingData.esi)) {
    esi = safe(data.esi);
  } else if (consileSalary <= 21000) {
    esi = (grossPay + plb) * 0.0075;
  }

  let esiEmployerShare = 0;
  if (isManuallyProvided(data.esiEmployerShare, existingData.esiEmployerShare)) {
    esiEmployerShare = safe(data.esiEmployerShare);
  } else if (consileSalary <= 21000) {
    esiEmployerShare = (grossPay + plb) * 0.0325;
  }

  let pt = 0;
  if (isManuallyProvided(data.pt, existingData.pt)) {
    pt = safe(data.pt);
  } else {
    if (grossPay > 20000) pt = 200;
    else if (grossPay > 15000) pt = 150;
    else pt = 100;
  }

  const gpap = isManuallyProvided(data.gpap, existingData.gpap)
    ? safe(data.gpap)
    : (consileSalary * 12 * 5 * 0.12) / 100 / 12;

  const otherDeductions = isManuallyProvided(
    data.otherDeductions,
    existingData.otherDeductions
  )
    ? safe(data.otherDeductions)
    : 0;

  const pf = isManuallyProvided(data.pf, existingData.pf)
    ? safe(data.pf)
    : basic3 * 0.12;

  const netPay = isManuallyProvided(data.netPay, existingData.netPay)
    ? safe(data.netPay)
    : grossPay + plb - (pf + esi + pt + tds + gpap + otherDeductions);

  const pfEmployerShare = isManuallyProvided(
    data.pfEmployerShare,
    existingData.pfEmployerShare
  )
    ? safe(data.pfEmployerShare)
    : basic3 * 0.12;

  const bonus = isManuallyProvided(data.bonus, existingData.bonus)
    ? safe(data.bonus)
    : grossPay * 0.0833;

  const lopCTC = isManuallyProvided(data.lopCTC, existingData.lopCTC)
    ? safe(data.lopCTC)
    : grossPay + pfEmployerShare + esiEmployerShare + bonus;

  return {
    lop,
    daysPaid,
    lop2,
    basic3,
    hra4,
    cca5,
    transportAllowance6: trp6,
    otherAllowance17: oalw17,
    grossPay,
    pf,
    esi,
    pt,
    gpap,
    otherDeductions,
    netPay,
    pfEmployerShare,
    esiEmployerShare,
    bonus,
    lopCTC
  };
};

// ===================================================
// SALARY GENERATION (FROM ATTENDANCE ONLY)
// ===================================================

const generateSalaryLogic = async () => {
  console.log('💰 Regenerating salary ONLY from MonthlySummary...');

  // 🔥 Always regenerate cleanly
  await Salary.deleteMany({});

  const summaries = await MonthlySummary.find();
  let count = 0;

  for (const summary of summaries) {
    const empId = summary.empId;
    const year = summary.year;
    const monthNumber = summary.month; // 1–12
    const monthName = MONTH_MAP[monthNumber - 1];

    const emp = await Employee.findOne({ empId });
    if (!emp) continue;

    // 🔥 GET EFFECTIVE SALARY FROM SALARY HISTORY
    const effectiveSalary = await getSalaryForMonth(empId, year, monthName);
    const useSalaryHistory = effectiveSalary !== null;

    // Fallback to Employee model if no history
    const actualCTC = useSalaryHistory ? effectiveSalary.actualCTC : (emp.actualCTCWithoutLOP || 0);

    if (useSalaryHistory) {
      console.log(`  💰 Using SalaryHistory: CTC=${actualCTC}, Basic=${effectiveSalary.basic}`);
    }



    /* =========================
       🔥 ATTENDANCE LOGIC (FINAL & LOCKED)
    ========================= */

    const totalDays = safe(summary.totalDays);

    const present = safe(summary.totalPresent);
    const weeklyOff = safe(summary.totalWOCount);
    const holiday = safe(summary.totalHOCount);

    // ✅ PAID DAYS = Present + WO + Holiday
    const daysPaid = present + weeklyOff + holiday;

    // ✅ LOP = Total Days - Paid Days
    const lop = Math.max(totalDays - daysPaid, 0);

    /* =========================
       BASE SALARY OBJECT
    ========================= */

    const base = {
      empId,
      empName: emp.empName || emp.EmpName,
      department: emp.department,
      designation: emp.designation,
      dob: emp.dob,
      doj: emp.doj,

      year,
      month: monthName,
      monthNumber,

      /* =========================
         ATTENDANCE CORE
      ========================= */
      totalDays,
      daysWorked: daysPaid,
      daysPaid,
      weeklyOff,
      holiday,
      lop,

      /* =========================
         SALARY INPUTS (FROM EFFECTIVE SALARY HISTORY)
      ========================= */
      consileSalary: safe(useSalaryHistory ? effectiveSalary.consileSalary : emp.consileSalary),
      basic: safe(useSalaryHistory ? effectiveSalary.basic : emp.basic),
      hra: safe(useSalaryHistory ? effectiveSalary.hra : emp.hra),
      cca: safe(useSalaryHistory ? effectiveSalary.cca : emp.cca),
      transportAllowance: safe(useSalaryHistory ? effectiveSalary.trpAlw : emp.trpAlw),
      otherAllowance1: safe(useSalaryHistory ? effectiveSalary.oAlw1 : emp.oAlw1),
      plb: safe(emp.plb),
      tds: safe(emp.tds),

      /* =========================
         HISTORICAL CTC (FROM EFFECTIVE SALARY)
      ========================= */
      actualCTCWithoutLOP: safe(actualCTC),
    };

    /* =========================
       🔥 DERIVED FIELDS
    ========================= */

    const computed = computeDerivedFields(base);

    await Salary.updateOne(
      { empId, year, month: monthName },
      { $set: { ...base, ...computed } },
      { upsert: true }
    );

    count++;
  }

  console.log(`✅ Salary generated correctly: ${count} rows`);
  return count;
};

// ===================================================
// API WRAPPER
// ===================================================

const generateSalaryFromEmployee = async (req, res) => {
  try {
    const count = await generateSalaryRecords();
    res.json({ message: `${count} salary records generated.` });
  } catch (err) {
    console.error('❌ Salary generation failed:', err);
    res.status(500).json({
      message: 'Failed to generate salary',
      error: err.message,
    });
  }
};

// ===================================================
// 🆕 MANUAL MASTER SALARY INSERT
// ===================================================
const insertManualSalary = async (req, res) => {
  try {
    const {
      empId, actualCTC, consileSalary, basic, hra, cca,
      trpAlw, oAlw1, effectiveFrom, updatedBy, reason
    } = req.body;

    if (!empId || !effectiveFrom || !updatedBy || !reason) {
      return res.status(400).json({
        message: 'empId, effectiveFrom, updatedBy, and reason are required'
      });
    }

    const effectiveDate = new Date(effectiveFrom);

    const overlap = await SalaryHistory.findOne({
      empId,
      effectiveFrom: { $lte: effectiveDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: effectiveDate } }]
    });

    if (overlap) {
      return res.status(400).json({
        message: 'A salary version already exists for this effective date'
      });
    }

    await SalaryHistory.findOneAndUpdate(
      { empId, effectiveTo: null },
      { effectiveTo: new Date(effectiveDate.getTime() - 86400000) }
    );

    const newSalary = await SalaryHistory.create({
      empId,
      actualCTC: safeNum(actualCTC),
      consileSalary: safeNum(consileSalary),
      basic: safeNum(basic),
      hra: safeNum(hra),
      cca: safeNum(cca),
      trpAlw: safeNum(trpAlw),
      oAlw1: safeNum(oAlw1),
      effectiveFrom: effectiveDate,
      effectiveTo: null,
      updatedBy,
      reason
    });

    res.status(201).json({ message: 'Manual salary inserted', data: newSalary });

  } catch (error) {
    res.status(500).json({ message: 'Failed to insert manual salary', error: error.message });
  }
};

// ===================================================
// 🆕 GET MASTER SALARY FOR MONTH (API Endpoint)
// ===================================================
const getSalaryHistoryForMonthAPI = async (req, res) => {
  try {
    const { empId, year, month } = req.query;

    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0);

    const salary = await SalaryHistory.findOne({
      empId,
      effectiveFrom: { $lte: toDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: fromDate } }]
    });

    if (!salary) {
      return res.status(404).json({ message: 'No salary history found' });
    }

    res.json(salary);

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch salary', error: error.message });
  }
};

// ===================================================
// CRUD + EXCEL UPLOAD
// ===================================================
const createSalary = async (req, res) => {
  try {
    const data = req.body;
    const computed = computeDerivedFields(data);
    const salary = new Salary({ ...data, ...computed });
    await salary.save();
    res.status(201).json({ message: 'Salary record created', salary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateSalary = async (req, res) => {
  try {
    const data = req.body;
    const existing = await Salary.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Salary record not found' });

    const mergedData = { ...existing._doc, ...data };
    const computed = computeDerivedFields(mergedData, existing._doc);

    const updated = await Salary.findByIdAndUpdate(
      req.params.id,
      { ...mergedData, ...computed },
      { new: true }
    );

    res.json({ message: 'Salary updated', salary: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllSalaries = async (req, res) => {
  const salaries = await Salary.find();
  res.json(salaries);
};

const getSalaryById = async (req, res) => {
  const salary = await Salary.findById(req.params.id);
  if (!salary) return res.status(404).json({ error: 'Salary not found' });
  res.json(salary);
};

const deleteSalary = async (req, res) => {
  const deleted = await Salary.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Salary not found' });
  res.json({ message: 'Salary deleted' });
};

const uploadSalaryExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const docs = [];

    for (const row of rows) {
      const empId = row['EmpID']?.toString().trim();
      const year = Number(row['Year']);
      const rawMonth = row['Month'];
      let month = normalizeMonth(rawMonth);

      // Handle numeric months like 9, 09, 10
      if (/^\d+$/.test(String(rawMonth).trim())) {
        const mIndex = Number(rawMonth) - 1;
        month = MONTH_MAP[mIndex] || null;
      }


      const resolvedCTC = await getCTCForMonth(empId, year, month);

      const base = {
        empId,
        empName: row['EmpName'],
        department: row['DEPT'],
        designation: row['DESIGNATION'],
        year,
        month,
        totalDays: safe(row['Total Days']),
        daysWorked: safe(row['Days Worked']),
        consileSalary: safe(row['CONSILE SALARY']),
        basic: safe(row['BASIC']),
        hra: safe(row['HRA']),
        cca: safe(row['CCA']),
        transportAllowance: safe(row['TRP_ALW']),
        otherAllowance1: safe(row['O_ALW1']),
        plb: safe(row['PLB']),
        tds: safe(row['TDS']),
        actualCTCWithoutLOP: safe(
          resolvedCTC !== null && resolvedCTC !== undefined ? resolvedCTC : 0
        )
      };

      const finalDoc = { ...base, ...computeDerivedFields(base) };
      docs.push(finalDoc);
    }

    if (docs.length) {
      await Salary.bulkWrite(
        docs.map((doc) => ({
          updateOne: {
            filter: { empId: doc.empId, year: doc.year, month: doc.month },
            update: { $set: doc },
            upsert: true
          }
        }))
      );
    }

    res.json({ message: `${docs.length} salary records uploaded.` });

  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// ===================================================
// FINAL EXPORT (ONLY ONE)
// ===================================================
module.exports = {
  createSalary,
  updateSalary,
  getAllSalaries,
  getSalaryById,
  deleteSalary,
  uploadSalaryExcel,
  generateSalaryFromEmployee,
  generateSalaryLogic,
  insertManualSalary,
  getSalaryHistoryForMonthAPI
};