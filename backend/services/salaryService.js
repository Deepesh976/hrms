const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const InputData = require('../models/InputData');
const MonthlySummary = require('../models/MonthlySummary');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
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
const getApprovedLeavesForSalary = async (empId, month, year) => {
  // Get start and end dates for the month
  const monthStartDate = new Date(year, month - 1, 1);
  const monthEndDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Find all approved leaves that overlap with this month
  const approvedLeaves = await LeaveRequest.find({
    empId,
    status: 'approved',
    $or: [
      {
        startDate: { $gte: monthStartDate, $lte: monthEndDate }
      },
      {
        endDate: { $gte: monthStartDate, $lte: monthEndDate }
      },
      {
        startDate: { $lte: monthStartDate },
        endDate: { $gte: monthEndDate }
      }
    ]
  });

  let paidLeaveDays = 0;    // AL - Annual Leave (PAID)
  let unpaidLeaveDays = 0;  // All others (UNPAID - deduct from salary)

  const leaveDetails = {
    al: 0,  // Annual Leave
    pl: 0,  // Privilege Leave
    cl: 0,  // Casual Leave
    sl: 0,  // Sick Leave
    ml: 0,  // Maternity Leave
    pl_paternity: 0,  // Paternity Leave
    bl: 0,  // Bereavement Leave
    co: 0,  // Compensatory Off
    lwp: 0  // Leave Without Pay
  };

  for (const leave of approvedLeaves) {
    const leaveType = await LeaveType.findOne({ code: leave.leaveType });

    if (!leaveType) continue;

    // Calculate days that fall within this month
    const leaveStart = leave.startDate < monthStartDate ? monthStartDate : leave.startDate;
    const leaveEnd = leave.endDate > monthEndDate ? monthEndDate : leave.endDate;

    // Simple day calculation (can be enhanced with working days logic)
    const daysInMonth = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
    const effectiveDays = leave.isHalfDay ? 0.5 : daysInMonth;

    // Categorize by leave type
    const typeKey = leave.leaveType.toLowerCase().replace('_', '');
    if (leaveDetails.hasOwnProperty(typeKey)) {
      leaveDetails[typeKey] += effectiveDays;
    }

    // CRITICAL BUSINESS RULE: Only AL (Annual Leave) is PAID
    // All other leave types are UNPAID and deducted from salary
    if (leaveType.isPaid && leave.leaveType === 'AL') {
      paidLeaveDays += effectiveDays;
      console.log(`    ✅ PAID Leave: ${leave.leaveType} = ${effectiveDays} days`);
    } else {
      unpaidLeaveDays += effectiveDays;
      console.log(`    💰 UNPAID Leave (LOP): ${leave.leaveType} = ${effectiveDays} days`);
    }
  }

  // Mark leaves as applied to salary
  if (approvedLeaves.length > 0) {
    await LeaveRequest.updateMany(
      { _id: { $in: approvedLeaves.map(l => l._id) } },
      {
        isAppliedToSalary: true,
        salaryMonth: month,
        salaryYear: year
      }
    );
  }

  return {
    paidLeaveDays,
    unpaidLeaveDays,
    leaveDetails,
    totalLeaveDays: paidLeaveDays + unpaidLeaveDays,
    approvedLeaveCount: approvedLeaves.length
  };
};

/**
 * Generate salary records from employee and summary data
 * NOW INTEGRATED WITH LEAVE SYSTEM
 * @returns {Promise<number>} - Number of records generated
 */
const generateSalaryRecords = async () => {
  console.log("💰 Deleting all existing salary records...");

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

    // Log warning if InputData not found or has zero values
    if (!input.EmpID) {
      console.warn(`  ⚠️ WARNING: No InputData found for employee ${empId} - salary components will be 0`);
      employeesWithoutInputData.push(empId);
    } else if (!input.Basic && !input.CONSILESALARY) {
      console.warn(`  ⚠️ WARNING: InputData found for ${empId} but Basic and CONSILESALARY are 0`);
    } else {
      console.log(`  ✅ InputData found: CONSILESALARY=${input.CONSILESALARY}, Basic=${input.Basic}, HRA=${input.HRA}`);
    }

    let carriedAL = 0;

    for (const summary of empSummaries) {
      const month = summary.month;
      const year = summary.year;

      const monthName = summary.monthName || new Date(year, month - 1).toLocaleString('default', { month: 'long' });

          const existingSalary = await Salary.findOne({
  empId,
  year,
  month: monthName
});


      // ===== LEAVE INTEGRATION =====
      // Get approved leaves from Leave Management System
      const leaveData = await getApprovedLeavesForSalary(empId, month, year);
      console.log(`  📅 Leaves for ${month}/${year}: AL=${leaveData.leaveDetails.al}, LOP=${leaveData.unpaidLeaveDays}`);

      // Calculate AL accrual (1 per month + 1 bonus per quarter)
      let grantedAL = 1;
      if (month % 3 === 0) grantedAL += 1; // Quarterly bonus (Mar, Jun, Sep, Dec)
      const totalAL = carriedAL + grantedAL;

      // AL consumed (only paid leave)
const usedAL = existingSalary?.al ?? safe(leaveData.leaveDetails.al || 0);
const lopDays = leaveData.unpaidLeaveDays;


      const remainingAL = Math.max(totalAL - usedAL, 0);


const totalPresent = safe(summary.totalPresent);
const totalWO = safe(summary.totalWOCount);
const totalAbsent = safe(summary.totalAbsent);
const totalHolidays = safe(summary.totalHOCount);

// Total days in month
const totalDaysInMonth =
  totalPresent + totalWO + totalAbsent + totalHolidays;

// Days worked (DO NOT subtract LOP again)
const daysWorked =
  totalPresent + totalWO + totalHolidays;


console.log(
  `📊 Day breakdown: Total=${totalDaysInMonth}, Present=${totalPresent}, WO=${totalWO}, Holidays=${totalHolidays}, Absent=${totalAbsent}, LOP=${lopDays}, Worked=${daysWorked}`
);


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
        totalDays: totalDaysInMonth,
        daysWorked: daysWorked,

        // Leave fields - from Leave Management System
        al: usedAL,  // Annual Leave (PAID) - doesn't affect salary
        pl: safe(leaveData.leaveDetails.pl || 0),  // Privilege Leave (UNPAID)
        blOrMl: safe((leaveData.leaveDetails.ml || 0) + (leaveData.leaveDetails.bl || 0)),  // ML + BL (UNPAID)
        lop: lopDays,  // Loss of Pay = ALL unpaid leaves (PL + ML + BL + CL + SL + LWP)

        // Additional leave detail fields
        cl: safe(leaveData.leaveDetails.cl || 0),  // Casual Leave (UNPAID)
        sl: safe(leaveData.leaveDetails.sl || 0),  // Sick Leave (UNPAID)
        lwp: safe(leaveData.leaveDetails.lwp || 0),  // Leave Without Pay

        // Salary components
        consileSalary: safe(input.CONSILESALARY),
        basic: safe(input.Basic),
        hra: safe(input.HRA),
        cca: safe(input.CCA),
        transportAllowance: safe(input.TRP_ALW),
        otherAllowance1: safe(input.O_ALW1),
        plb: safe(input.PLB),
        tds: safe(input.TDS),
        actualCTCWithoutLOP: safe(input.ActualCTCWithoutLossOfPay || 0),

        // For reference
        annualLeaves: totalAL,
        usedAL,
        carriedAL: remainingAL
      };

      const computed = computeDerivedFields(base, existingSalary || {});
      allDocs.push({ ...base, ...computed });

      carriedAL = remainingAL;
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
  getApprovedLeavesForSalary,
  createSalary,
  updateSalary,
  getAllSalaries,
  getSalaryById,
  deleteSalary,
  getSalaryByEmpAndMonth
};

