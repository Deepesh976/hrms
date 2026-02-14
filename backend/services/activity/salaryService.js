const Salary = require('../../models/Salary');
const Employee = require('../../models/Employee');
const InputData = require('../../models/InputData');
const MonthlySummary = require('../../models/MonthlySummary');
const LeaveRequest = require('../../models/LeaveRequest');
const LeaveType = require('../../models/LeaveType');
const SalaryHistory = require('../../models/SalaryHistory');
const { safe, isManuallyProvided } = require('../../utils/helpers');

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

const MONTH_MAP = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const getCTCForMonth = async (empId, year, monthName) => {
  const normalized = normalizeMonth(monthName);
  const monthIndex = MONTH_MAP.indexOf(normalized);
  if (monthIndex === -1) return null;

  // Target month date range (1st → last day of month)
  const fromDate = new Date(Date.UTC(year, monthIndex, 1));
  const toDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

  const history = await SalaryHistory.find({
    empId,
    effectiveFrom: { $lte: toDate },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: fromDate } }
    ]
  }).sort({ effectiveFrom: -1 }); // newest first

  if (!history.length) return null;

  return history[0].actualCTC;
};


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

  /* ===============================
     CORE PAYROLL RULE
     ===============================

     daysWorked = already calculated in generateSalaryRecords
     daysPaid   = daysWorked (unless manually changed)
     lop        = totalDays - daysPaid (unless manually changed)

  ================================= */

const al = safe(data.al);

// Base LOP before AL adjustment
const baseLop = Math.max(totalDays - daysWorked, 0);

// Reduce LOP using AL
const adjustedLop = Math.max(baseLop - al, 0);

const lop = isManuallyProvided(data.lop, existingData.lop)
  ? safe(data.lop)
  : adjustedLop;

const daysPaid = isManuallyProvided(data.daysPaid, existingData.daysPaid)
  ? safe(data.daysPaid)
  : totalDays - lop;


  /* ===============================
     SALARY INPUTS
  ================================= */

  const consileSalary = safe(data.consileSalary);
  const basic = safe(data.basic);
  const hra = safe(data.hra);
  const cca = safe(data.cca);
  const trp = safe(data.transportAllowance);
  const oalw = safe(data.otherAllowance1);
  const plb = safe(data.plb);
  const tds = safe(data.tds);

  /* ===============================
     SALARY CALCULATIONS
  ================================= */

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

  const trp6 = isManuallyProvided(data.transportAllowance6, existingData.transportAllowance6)
    ? safe(data.transportAllowance6)
    : totalDays
      ? (trp / totalDays) * daysPaid
      : 0;

  const oalw17 = isManuallyProvided(data.otherAllowance17, existingData.otherAllowance17)
    ? safe(data.otherAllowance17)
    : totalDays
      ? (oalw / totalDays) * daysPaid
      : 0;

  const grossPay = isManuallyProvided(data.grossPay, existingData.grossPay)
    ? safe(data.grossPay)
    : basic3 + hra4 + cca5 + trp6 + oalw17;

  /* ===============================
     STATUTORY CALCULATIONS
  ================================= */

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
    : 0;

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
    : (grossPay + plb) - (pf + esi + pt + tds + gpap + otherDeductions);

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
    al: 0,  // Annual Leave (PAID)
    cl: 0,  // Casual Leave (UNPAID)
    btl: 0  // Business Trip Leave (PAID upon approval)
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

    // CRITICAL BUSINESS RULE: 
    // - AL (Annual Leave) is PAID
    // - BTL (Business Trip Leave) is PAID upon approval
    // - CL (Casual Leave) is UNPAID and deducted from salary
    if (leaveType.isPaid && (leave.leaveType === 'AL' || leave.leaveType === 'BTL')) {
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

const generateSalaryRecords = async () => {
  console.log("💰 Fetching employees, input data, and monthly summaries...");

  const employees = await Employee.find();
  const inputData = await InputData.find();
  const summaries = await MonthlySummary.find();

  console.log(
    `📊 Found: ${employees.length} employees, ${inputData.length} input data records, ${summaries.length} monthly summaries`
  );

  // Build InputData map
  const inputMap = {};
  inputData.forEach((i) => {
    const normalizedId = normalizeEmpIdForComparison(i.EmpID);
    inputMap[normalizedId] = i;

    const variations = getEmpIdVariations(i.EmpID);
    variations.forEach((v) => {
      if (!inputMap[v]) inputMap[v] = i;
    });
  });

  const allDocs = [];

  for (const emp of employees) {
    const empId = (emp.empId || "").trim();
    const normalizedEmpId = normalizeEmpIdForComparison(empId);

    const empSummaries = summaries
      .filter((s) => normalizeEmpIdForComparison(s.empId) === normalizedEmpId)
      .sort((a, b) => a.year - b.year || a.month - b.month);

    if (!empSummaries.length) continue;

    const input = findInputDataForEmployee(inputMap, inputData, empId) || {};

    let carriedAL = 0;

    for (const summary of empSummaries) {
      const month = summary.month;
      const year = summary.year;
      const monthName = MONTH_MAP[month - 1];

      const existingSalary = await Salary.findOne({
        empId,
        year,
        month: monthName
      });

      // ===== LEAVE DATA =====
      const leaveData = await getApprovedLeavesForSalary(empId, month, year);

      let grantedAL = 1;
      if (month % 3 === 0) grantedAL += 1;

      const totalAL = carriedAL + grantedAL;

      const usedAL = safe(leaveData.leaveDetails.al || 0);
      const remainingAL = Math.max(totalAL - usedAL, 0);

      const lopDays = safe(leaveData.unpaidLeaveDays);

      // ===== ATTENDANCE =====
      const totalPresent = safe(summary.totalPresent);
      const totalWO = safe(summary.totalWOCount);
      const totalAbsent = safe(summary.totalAbsent);
      const totalHolidays = safe(summary.totalHOCount);

      const totalDaysInMonth =
        totalPresent + totalWO + totalAbsent + totalHolidays;

      const daysWorked =
        totalPresent + totalWO + totalHolidays;

      console.log(
        `📊 ${empId} ${monthName}-${year} | Total=${totalDaysInMonth}, Worked=${daysWorked}, LOP=${lopDays}`
      );

      const resolvedCTC = await getCTCForMonth(empId, year, monthName);

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
        weeklyOff: totalWO,
        holiday: totalHolidays,

        // Leave
        al: usedAL,
        cl: safe(leaveData.leaveDetails.cl || 0),
        btl: safe(leaveData.leaveDetails.btl || 0),
        lop: lopDays,

        // Salary Inputs
        consileSalary: safe(input.CONSILESALARY),
        basic: safe(input.Basic),
        hra: safe(input.HRA),
        cca: safe(input.CCA),
        transportAllowance: safe(input.TRP_ALW),
        otherAllowance1: safe(input.O_ALW1),
        plb: safe(input.PLB),
        tds: safe(input.TDS),

        actualCTCWithoutLOP: safe(
          resolvedCTC ?? input.ActualCTCWithoutLossOfPay ?? 0
        ),

        // Leave Balance
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
    await Salary.bulkWrite(
      allDocs.map((doc) => ({
        updateOne: {
          filter: { empId: doc.empId, year: doc.year, month: doc.month },
          update: { $set: doc },
          upsert: true
        }
      }))
    );
  }

  console.log(`✅ Salary generation complete: ${allDocs.length} records created`);
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

