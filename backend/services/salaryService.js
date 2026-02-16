const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const InputData = require('../models/InputData');
const MonthlySummary = require('../models/MonthlySummary');
const SalaryHistory = require('../models/SalaryHistory');
const { safe, isManuallyProvided } = require('../utils/helpers');

/**
 * Normalize employee ID for comparison
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes leading zeros for numeric IDs
 * @param {string} empId - Employee ID
 * @returns {string} - Normalized employee ID
 */
const normalizeEmpIdForComparison = (empId) => {
  if (!empId) return '';
  const trimmed = String(empId).trim().toLowerCase();

  // If the ID is purely numeric, remove leading zeros
  // But preserve alphanumeric IDs like "E001" as is (just lowercased)
  if (/^\d+$/.test(trimmed)) {
    return String(parseInt(trimmed, 10));
  }

  return trimmed;
};

/**
 * Get all possible variations of an employee ID for flexible matching
 * @param {string} empId - Employee ID
 * @returns {string[]} - Array of possible ID variations
 */
const getEmpIdVariations = (empId) => {
  if (!empId) return [];
  const trimmed = String(empId).trim();
  const variations = new Set();

  // Add original (lowercase)
  variations.add(trimmed.toLowerCase());

  // Add without leading zeros if numeric
  if (/^\d+$/.test(trimmed)) {
    variations.add(String(parseInt(trimmed, 10)));
  }

  // Add with common prefixes removed (e.g., "EMP001" -> "001" -> "1")
  const withoutPrefix = trimmed.replace(/^[A-Za-z]+/i, '');
  if (withoutPrefix && /^\d+$/.test(withoutPrefix)) {
    variations.add(String(parseInt(withoutPrefix, 10)));
    variations.add(withoutPrefix);
  }

  // Add padded versions (e.g., "1" -> "01", "001")
  if (/^\d+$/.test(trimmed)) {
    const numVal = parseInt(trimmed, 10);
    variations.add(numVal.toString().padStart(2, '0'));
    variations.add(numVal.toString().padStart(3, '0'));
    variations.add(numVal.toString().padStart(4, '0'));
  }

  return Array.from(variations);
};

/**
 * Find InputData for an employee using flexible matching
 * @param {Object} inputMap - Map of normalized empId to InputData
 * @param {Object} inputDataArray - Raw InputData array for fallback matching
 * @param {string} empId - Employee ID to find
 * @returns {Object|null} - InputData or null if not found
 */
const findInputDataForEmployee = (inputMap, inputDataArray, empId) => {
  // First try direct normalized lookup
  const normalizedId = normalizeEmpIdForComparison(empId);
  if (inputMap[normalizedId]) {
    return inputMap[normalizedId];
  }

  // Try all variations
  const variations = getEmpIdVariations(empId);
  for (const variation of variations) {
    if (inputMap[variation]) {
      console.log(`  🔄 Found InputData using variation: ${empId} -> ${variation}`);
      return inputMap[variation];
    }
  }

  // Last resort: search the array directly for any partial match
  const empIdLower = String(empId).trim().toLowerCase();
  const found = inputDataArray.find(input => {
    const inputIdLower = String(input.EmpID || '').trim().toLowerCase();
    // Check if one contains the other or if numeric parts match
    return inputIdLower === empIdLower ||
      inputIdLower.endsWith(empIdLower) ||
      empIdLower.endsWith(inputIdLower);
  });

  if (found) {
    console.log(`  🔄 Found InputData using partial match: ${empId} -> ${found.EmpID}`);
    return found;
  }

  return null;
};

const computeDerivedFields = (data, existingData = {}) => {
const totalDays = safe(data.totalDays);
const daysWorked = safe(data.daysWorked);

const al = safe(data.al);
const pl = safe(data.pl);
const blOrMl = safe(data.blOrMl);


  // -----------------------------
  // LOP Logic
  // -----------------------------

  // Initial LOP based on attendance
// ------------------------------------
// NEW CORRECT LOGIC
// ------------------------------------

// Only unpaid leaves reduce salary
// LOP already coming from generateSalaryRecords (lopDays)

let lop;

if (isManuallyProvided(data.lop, existingData.lop)) {
  lop = safe(data.lop);
} else {
  lop = safe(data.lop); // keep system calculated unpaid leaves
}

// -----------------------------
// STANDARD DAYS PAID LOGIC
// -----------------------------
let daysPaid;

if (isManuallyProvided(data.daysPaid, existingData.daysPaid)) {
  daysPaid = safe(data.daysPaid);
} else {
  daysPaid = totalDays - lop;   // ✅ CORRECT
}



  // -----------------------------
  // Salary Components
  // -----------------------------

  const consileSalary = safe(data.consileSalary);
  const basic = safe(data.basic);
  const hra = safe(data.hra);
  const cca = safe(data.cca);
  const trp = safe(data.transportAllowance);
  const oalw = safe(data.otherAllowance1);
  const plb = safe(data.plb);
  const tds = safe(data.tds);

  // Salary component calculations
  const lop2 = isManuallyProvided(data.lop2, existingData.lop2)
    ? safe(data.lop2)
    : (totalDays ? (consileSalary / totalDays) * lop : 0);

  const basic3 = isManuallyProvided(data.basic3, existingData.basic3)
    ? safe(data.basic3)
    : (totalDays ? (basic / totalDays) * daysPaid : 0);

  const hra4 = isManuallyProvided(data.hra4, existingData.hra4)
    ? safe(data.hra4)
    : (totalDays ? (hra / totalDays) * daysPaid : 0);

  const cca5 = isManuallyProvided(data.cca5, existingData.cca5)
    ? safe(data.cca5)
    : (totalDays ? (cca / totalDays) * daysPaid : 0);

  const trp6 = isManuallyProvided(data.transportAllowance6, existingData.transportAllowance6)
    ? safe(data.transportAllowance6)
    : (totalDays ? (trp / totalDays) * daysPaid : 0);

  const oalw17 = isManuallyProvided(data.otherAllowance17, existingData.otherAllowance17)
    ? safe(data.otherAllowance17)
    : (totalDays ? (oalw / totalDays) * daysPaid : 0);


  // Gross Pay - use manual value if provided AND changed, otherwise calculate
  const grossPay = isManuallyProvided(data.grossPay, existingData.grossPay) ? safe(data.grossPay) :
    basic3 + hra4 + cca5 + trp6 + oalw17;

  // ESI (Employee Share)
  let esi = 0;
  if (isManuallyProvided(data.esi, existingData.esi)) {
    esi = safe(data.esi);
  } else if (consileSalary <= 21000) {
    esi = (grossPay + plb) * 0.0075; // 0.75%
  }

  // ESI Employer Share Calculation
  let esiEmployerShare = 0;
  if (isManuallyProvided(data.esiEmployerShare, existingData.esiEmployerShare)) {
    esiEmployerShare = safe(data.esiEmployerShare);
  } else if (consileSalary <= 21000) {
    esiEmployerShare = (grossPay + plb) * 0.0325;
  } else {
    esiEmployerShare = 0;
  }

  // Professional Tax
  let pt = 0;
  if (isManuallyProvided(data.pt, existingData.pt)) {
    pt = safe(data.pt);
  } else {
    if (grossPay > 20000) pt = 200;
    else if (grossPay > 15000) pt = 150;
    else pt = 100;
  }

  // Other calculations
  // GPAP should always be 0 unless manually entered
  const gpap = isManuallyProvided(data.gpap, existingData.gpap) ? safe(data.gpap) : 0;

  const otherDeductions = isManuallyProvided(data.otherDeductions, existingData.otherDeductions) ? safe(data.otherDeductions) : 0;

  const pf = isManuallyProvided(data.pf, existingData.pf) ? safe(data.pf) : basic3 * 0.12;

  const netPay = isManuallyProvided(data.netPay, existingData.netPay) ? safe(data.netPay) :
    (grossPay + plb) - (pf + esi + pt + tds + gpap + otherDeductions);

  const pfEmployerShare = isManuallyProvided(data.pfEmployerShare, existingData.pfEmployerShare) ? safe(data.pfEmployerShare) :
    basic3 * 0.12;

  const bonus = isManuallyProvided(data.bonus, existingData.bonus) ? safe(data.bonus) : grossPay * 0.0833;

  const lopCTC = isManuallyProvided(data.lopCTC, existingData.lopCTC) ? safe(data.lopCTC) :
    grossPay + pfEmployerShare + esiEmployerShare + bonus;

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

/**
 * Get approved leaves for an employee in a specific month/year
 * Calculates paid vs unpaid leaves for salary integration
 * 
 * IMPORTANT LEAVE RULES:
 * - PAID LEAVES: Only AL (Annual Leave) - doesn't affect salary
 * - UNPAID LEAVES: All others (PL, CL, SL, ML, BL, CO, LWP) - deducted as LOP
 * - Holidays: Counted as paid working days (via MonthlySummary.totalHOCount)
 * - Weekly Offs: Counted as paid working days (via MonthlySummary.totalWOCount)
 * 
 * @param {string} empId - Employee ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} - Leave data for salary calculation
 */

/**
 * Generate salary records from employee and summary data
 * NOW INTEGRATED WITH LEAVE SYSTEM
 * @returns {Promise<number>} - Number of records generated
 */
const generateSalaryRecords = async () => {

  console.log("💰 Fetching employees, input data, and monthly summaries...");
  const employees = await Employee.find();
  const inputData = await InputData.find();
  const summaries = await MonthlySummary.find();

  console.log(`📊 Found: ${employees.length} employees, ${inputData.length} input data records, ${summaries.length} monthly summaries`);

  // Build input map with multiple key variations for flexible matching
  const inputMap = {};
  inputData.forEach(i => {
    // Use normalized empId for consistent matching
    const normalizedId = normalizeEmpIdForComparison(i.EmpID);
    inputMap[normalizedId] = i;

    // Also add variations for better matching
    const variations = getEmpIdVariations(i.EmpID);
    variations.forEach(v => {
      if (!inputMap[v]) {
        inputMap[v] = i;
      }
    });
  });

  console.log(`📊 Built InputData map with ${Object.keys(inputMap).length} key variations`);

  const allDocs = [];
  let employeesWithoutInputData = [];
  let employeesWithoutSummaries = [];

  for (const emp of employees) {
    const empId = (emp.empId || '').trim();
    const normalizedEmpId = normalizeEmpIdForComparison(empId);
    console.log(`💰 Processing employee: ${empId} (normalized: ${normalizedEmpId}) - ${emp.empName}`);

    const empSummaries = summaries
      .filter(s => normalizeEmpIdForComparison(s.empId) === normalizedEmpId)
      .sort((a, b) => a.year - b.year || a.month - b.month);

    console.log(`  Found ${empSummaries.length} summaries for employee ${empId}`);

    if (!empSummaries.length) {
      employeesWithoutSummaries.push(empId);
      continue;
    }

    // Use flexible matching to find InputData
    const input = findInputDataForEmployee(inputMap, inputData, empId) || {};
    // 🔥 Fetch all salary history for this employee ONCE
const salaryHistories = await SalaryHistory.find({ empId })
  .sort({ effectiveFrom: 1 });


    // Log warning if InputData not found or has zero values
    if (!input.EmpID) {
      console.warn(`  ⚠️ WARNING: No InputData found for employee ${empId} - salary components will be 0`);
      employeesWithoutInputData.push(empId);
    } else if (!input.Basic && !input.CONSILESALARY) {
      console.warn(`  ⚠️ WARNING: InputData found for ${empId} but Basic and CONSILESALARY are 0`);
    } else {
      console.log(`  ✅ InputData found: CONSILESALARY=${input.CONSILESALARY}, Basic=${input.Basic}, HRA=${input.HRA}`);
    }

    // let carriedAL = 0;

    for (const summary of empSummaries) {
      const month = summary.month;
      const year = summary.year;

      const monthName = summary.monthName || new Date(year, month - 1).toLocaleString('default', { month: 'long' });

          const existingSalary = await Salary.findOne({
  empId,
  year,
  month: monthName
});


// ===== ANNUAL LEAVE FROM MONTHLY SUMMARY =====

// ALF = 1 day
// ALH = 0.5 day
const totalALF = safe(summary.totalALF || 0);
const totalALH = safe(summary.totalALH || 0);

// Final paid Annual Leave
const usedAL = totalALF + (totalALH * 0.5);

// Attendance components
const totalPresent = safe(summary.totalPresent);
const totalWO = safe(summary.totalWOCount);
const totalHolidays = safe(summary.totalHOCount);

// Days Worked = Present + Weekly Off + Holidays
const daysWorked = totalPresent + totalWO + totalHolidays;

// Total Days must come from payroll cycle
const totalDaysInMonth = safe(summary.totalDays);

// ===== LOP CALCULATION =====
// LOP = Total Days - (Worked + Paid Leave)
let lopDays = totalDaysInMonth - (daysWorked + usedAL);

if (lopDays < 0) lopDays = 0;

// ===============================
// 🔥 GET CORRECT SALARY HISTORY
// ===============================

let salaryHistoryEntry = null;

// Payroll cycle start = 21st of previous month
const payrollCycleStart =
  month === 1
    ? new Date(year - 1, 11, 21)
    : new Date(year, month - 2, 21);

const targetDate = payrollCycleStart;

for (const history of salaryHistories) {
  if (
    history.effectiveFrom <= targetDate &&
    (!history.effectiveTo || history.effectiveTo >= targetDate)
  ) {
    salaryHistoryEntry = history;
  }
}



// Use SalaryHistory if exists, otherwise fallback to InputData
const consileSalary = safe(
  salaryHistoryEntry?.consileSalary ?? input.CONSILESALARY ?? 0
);

const basic = safe(
  salaryHistoryEntry?.basic ?? input.Basic ?? 0
);

const hra = safe(
  salaryHistoryEntry?.hra ?? input.HRA ?? 0
);

const cca = safe(
  salaryHistoryEntry?.cca ?? input.CCA ?? 0
);

const trpAlw = safe(
  salaryHistoryEntry?.trpAlw ?? input.TRP_ALW ?? 0
);

const oAlw1 = safe(
  salaryHistoryEntry?.oAlw1 ?? input.O_ALW1 ?? 0
);

const actualCTC = safe(
  salaryHistoryEntry?.actualCTC ?? input.ActualCTCWithoutLossOfPay ?? 0
);

console.log(
  `📊 ${empId} ${monthName}-${year} | Total=${totalDaysInMonth}, Worked=${daysWorked}, AL=${usedAL}, LOP=${lopDays}, CTC=${actualCTC}`
);

// ===============================
// BASE OBJECT
// ===============================

const base = {
  empId,
  empName: emp.empName,
  department: emp.department,
  designation: emp.designation,
  dob: emp.dob,
  doj: emp.doj,

  year,
  month: monthName,
  monthNumber: month,

  // Attendance
  totalDays: totalDaysInMonth,
  daysWorked,

  // Paid Leave
  al: usedAL,

  // Unpaid Leave
  lop: lopDays,

  // Salary components (timeline-safe)
  consileSalary,
  basic,
  hra,
  cca,
  transportAllowance: trpAlw,
  otherAllowance1: oAlw1,

  plb: safe(input.PLB),
  tds: safe(input.TDS),

  actualCTCWithoutLOP: actualCTC
};

const computed = computeDerivedFields(base, existingSalary || {});
allDocs.push({ ...base, ...computed });


      // carriedAL = remainingAL;
    }
  }

  if (allDocs.length) {
    console.log(`💰 Writing ${allDocs.length} salary records to the database...`);
    await Salary.bulkWrite(
      allDocs.map(doc => ({
        updateOne: {
          filter: { empId: doc.empId, year: doc.year, month: doc.month },
          update: { $set: doc },
          upsert: true
        }
      }))
    );
  } else {
    console.log("💰 No salary records to write.");
  }

  // Log summary of issues
  if (employeesWithoutInputData.length > 0) {
    console.warn(`\n⚠️ SALARY WARNING: ${employeesWithoutInputData.length} employees have no InputData (salary will be 0):`);
    console.warn(`   ${employeesWithoutInputData.slice(0, 10).join(', ')}${employeesWithoutInputData.length > 10 ? '...' : ''}`);
    console.warn(`   💡 Please upload InputData for these employees and regenerate salaries.`);
  }

  if (employeesWithoutSummaries.length > 0) {
    console.warn(`\n⚠️ SALARY WARNING: ${employeesWithoutSummaries.length} employees have no MonthlySummary (skipped):`);
    console.warn(`   ${employeesWithoutSummaries.slice(0, 10).join(', ')}${employeesWithoutSummaries.length > 10 ? '...' : ''}`);
  }

  console.log(`\n✅ Salary generation complete: ${allDocs.length} records created`);

  return allDocs.length;
};

/**
 * Create new salary record
 * @param {Object} salaryData - Salary data
 * @returns {Promise<Object>} - Created salary record
 */
const createSalary = async (salaryData) => {
  const computed = computeDerivedFields(salaryData);
  const salary = new Salary({ ...salaryData, ...computed });
  await salary.save();
  return salary;
};

/**
 * Update salary record
 * @param {string} salaryId - Salary record ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated salary record
 */
const updateSalary = async (salaryId, updateData) => {
  const existing = await Salary.findById(salaryId);
  if (!existing) {
    throw new Error('Salary record not found');
  }

  const mergedData = { ...existing._doc, ...updateData };
  const computed = computeDerivedFields(mergedData, existing._doc);

  const updated = await Salary.findByIdAndUpdate(
    salaryId,
    { ...mergedData, ...computed },
    { new: true }
  );

  return updated;
};

/**
 * Get all salary records
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - Salary records
 */
const getAllSalaries = async (filter = {}) => {
  const salaries = await Salary.find(filter);
  return salaries.map(s => ({
    ...s._doc,
    dob: s.dob ? s.dob.toISOString().split('T')[0] : '',
    doj: s.doj ? s.doj.toISOString().split('T')[0] : ''
  }));
};

/**
 * Get salary by ID
 * @param {string} salaryId - Salary record ID
 * @returns {Promise<Object>} - Salary record
 */
const getSalaryById = async (salaryId) => {
  const salary = await Salary.findById(salaryId);
  if (!salary) {
    throw new Error('Salary record not found');
  }

  return {
    ...salary._doc,
    dob: salary.dob ? salary.dob.toISOString().split('T')[0] : '',
    doj: salary.doj ? salary.doj.toISOString().split('T')[0] : ''
  };
};

/**
 * Delete salary record
 * @param {string} salaryId - Salary record ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteSalary = async (salaryId) => {
  const deleted = await Salary.findByIdAndDelete(salaryId);
  if (!deleted) {
    throw new Error('Salary record not found');
  }
  return true;
};

/**
 * Get salary by employee ID and month/year
 * @param {string} empId - Employee ID
 * @param {number} year - Year
 * @param {number} month - Month
 * @returns {Promise<Object>} - Salary record
 */
const getSalaryByEmpAndMonth = async (empId, year, month) => {
  const salary = await Salary.findOne({ empId, year, month });
  return salary;
};

module.exports = {
  computeDerivedFields,
  generateSalaryRecords,
  createSalary,
  updateSalary,
  getAllSalaries,
  getSalaryById,
  deleteSalary,
  getSalaryByEmpAndMonth
};

