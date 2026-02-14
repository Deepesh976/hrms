const LeaveRequest = require('../models/LeaveRequest');
const EmployeeLeaveBalance = require('../models/EmployeeLeaveBalance');
const LeaveType = require('../models/LeaveType');
const LeaveCalendar = require('../models/LeaveCalendar');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveTransaction = require('../models/LeaveTransaction');
const Employee = require('../models/Employee');
const { APP_CONSTANTS } = require('../utils/constants');

// ========================================
// LEAVE BALANCE FUNCTIONS
// ========================================

/**
 * Get employee leave balance for current year
 * @param {string} empId - Employee ID
 * @param {number} year - Year (defaults to current year)
 * @returns {Promise<Object>} - Leave balance document
 */
const getEmployeeLeaveBalance = async (empId, year = new Date().getFullYear()) => {
  let balance = await EmployeeLeaveBalance.findOne({ empId, year });

  // If no balance exists, initialize it
  if (!balance) {
    balance = await initializeEmployeeLeaveBalance(empId, year);
  }

  return balance;
};

/**
 * Initialize leave balance for a new employee or new year
 * @param {string} empId - Employee ID
 * @param {number} year - Year
 * @returns {Promise<Object>} - Created balance document
 */
const initializeEmployeeLeaveBalance = async (empId, year) => {
  const employee = await Employee.findOne({ empId });
  if (!employee) {
    throw new Error('Employee not found');
  }

  const policy = await LeavePolicy.getDefaultPolicy();
  const leaveTypes = await LeaveType.find({ isActive: true, code: 'AL' }); // Only AL is accrued

  const leaveBalances = [];

  for (const leaveType of leaveTypes) {
    const allocation = policy.defaultLeaveAllocations.find(a => a.leaveType === leaveType.code);

    if (!allocation) continue;

    // Calculate prorated allocation for mid-year joiners
    let proratedAllocation = allocation.annualAllocation;

    if (leaveType.isProratedForNewJoiners && employee.doj) {
      const doj = new Date(employee.doj);
      const dojYear = doj.getFullYear();

      if (dojYear === year) {
        // Joined this year - prorate
        const monthsRemaining = 12 - doj.getMonth();
        proratedAllocation = Math.ceil((allocation.annualAllocation / 12) * monthsRemaining);
      }
    }

    leaveBalances.push({
      leaveType: leaveType.code,
      leaveTypeName: leaveType.name,
      opening: 0,
      allocated: proratedAllocation,
      accrued: proratedAllocation,
      consumed: 0,
      pending: 0,
      approved: 0,
      balance: proratedAllocation,
      lapsed: 0,
      carriedForward: 0,
      encashed: 0,
      maxCarryForward: leaveType.maxCarryForward,
      maxAccumulation: leaveType.maxAccumulation,
      lastAccrualDate: new Date(),
      nextAccrualDate: new Date(year, new Date().getMonth() + 1, 1)
    });
  }

  const balance = await EmployeeLeaveBalance.create({
    empId: employee.empId,
    empName: employee.empName,
    year,
    leaveBalances
  });

  return balance;
};

/**
 * Update leave balance for an employee
 * @param {string} empId - Employee ID
 * @param {string} leaveType - Leave type code
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated balance
 */
const updateLeaveBalance = async (empId, leaveType, updates) => {
  const year = new Date().getFullYear();
  const balance = await getEmployeeLeaveBalance(empId, year);

  const leaveBalance = balance.getLeaveBalance(leaveType);
  if (!leaveBalance) {
    throw new Error(`Leave type ${leaveType} not found for employee`);
  }

  Object.assign(leaveBalance, updates);

  // Recalculate balance
  leaveBalance.balance = leaveBalance.accrued - leaveBalance.consumed - leaveBalance.pending;

  await balance.save();
  return balance;
};

/**
 * Reserve leave balance (when request is pending)
 * @param {string} empId - Employee ID
 * @param {string} leaveType - Leave type
 * @param {number} days - Days to reserve
 * @returns {Promise<Object>} - Updated balance
 */
const reserveLeaveBalance = async (empId, leaveType, days) => {
  const balance = await getEmployeeLeaveBalance(empId);
  const leaveBalance = balance.getLeaveBalance(leaveType);

  if (!leaveBalance) {
    throw new Error(`Leave type ${leaveType} not configured for employee`);
  }

  // Reserve from balance
  leaveBalance.pending += days;
  leaveBalance.balance = leaveBalance.accrued - leaveBalance.consumed - leaveBalance.pending;

  await balance.save();
  return balance;
};

/**
 * Release reserved balance (when request is rejected/cancelled)
 * @param {string} empId - Employee ID
 * @param {string} leaveType - Leave type
 * @param {number} days - Days to release
 * @returns {Promise<Object>} - Updated balance
 */
const releaseLeaveBalance = async (empId, leaveType, days) => {
  const balance = await getEmployeeLeaveBalance(empId);
  const leaveBalance = balance.getLeaveBalance(leaveType);

  if (!leaveBalance) {
    throw new Error(`Leave type ${leaveType} not configured for employee`);
  }

  // Release back to balance
  leaveBalance.pending -= days;
  leaveBalance.balance = leaveBalance.accrued - leaveBalance.consumed - leaveBalance.pending;

  await balance.save();
  return balance;
};

/**
 * Consume leave balance (when request is approved)
 * @param {string} empId - Employee ID
 * @param {string} leaveType - Leave type
 * @param {number} days - Days to consume
 * @returns {Promise<Object>} - Updated balance
 */
const consumeLeaveBalance = async (empId, leaveType, days) => {
  const balance = await getEmployeeLeaveBalance(empId);
  const leaveBalance = balance.getLeaveBalance(leaveType);

  if (!leaveBalance) {
    throw new Error(`Leave type ${leaveType} not configured for employee`);
  }

  // Move from pending to consumed
  leaveBalance.pending -= days;
  leaveBalance.consumed += days;
  leaveBalance.balance = leaveBalance.accrued - leaveBalance.consumed - leaveBalance.pending;

  await balance.save();
  return balance;
};

/**
 * Check if employee has sufficient balance
 * @param {string} empId - Employee ID
 * @param {string} leaveType - Leave type
 * @param {number} days - Days requested
 * @returns {Promise<Object>} - {sufficient: boolean, availableBalance: number}
 */
const checkBalanceSufficiency = async (empId, leaveType, days) => {
  // Only check balance for AL (Annual Leave)
  // Other leave types are unpaid, so no balance check needed
  if (leaveType !== 'AL') {
    return {
      sufficient: true,
      availableBalance: 999,
      message: 'Balance check not required for unpaid leave'
    };
  }

  const balance = await getEmployeeLeaveBalance(empId);
  const leaveBalance = balance.getLeaveBalance(leaveType);

  if (!leaveBalance) {
    return {
      sufficient: false,
      availableBalance: 0,
      message: 'Leave type not configured'
    };
  }

  const availableBalance = balance.getTotalAvailableBalance(leaveType);
  const policy = await LeavePolicy.getDefaultPolicy();

  // Check if negative balance is allowed
  if (policy.allowNegativeBalance) {
    const allowedNegative = policy.maxNegativeBalance;
    const effectiveBalance = availableBalance + allowedNegative;

    return {
      sufficient: days <= effectiveBalance,
      availableBalance: effectiveBalance,
      message: days > effectiveBalance ? 'Insufficient balance (including advance limit)' : null
    };
  }

  return {
    sufficient: days <= availableBalance,
    availableBalance,
    message: days > availableBalance ? 'Insufficient balance' : null
  };
};

// ========================================
// WORKING DAYS CALCULATION
// ========================================

/**
 * Calculate working days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} empId - Employee ID (for department-specific holidays)
 * @param {boolean} isHalfDay - Is half day leave
 * @returns {Promise<number>} - Number of working days
 */
const calculateWorkingDays = async (startDate, endDate, empId = null, isHalfDay = false) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get employee department for holiday filtering
  let department = 'All';
  if (empId) {
    const employee = await Employee.findOne({ empId });
    if (employee) {
      department = employee.department || 'All';
    }
  }

  // Get holidays in range
  const holidays = await getHolidaysInRange(start, end, department);
  const holidayDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

  // Get policy for weekend configuration
  const policy = await LeavePolicy.getDefaultPolicy();
  const weekends = policy.weekends || ['Sunday'];

  let workingDays = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if it's a weekend
    const isWeekend = weekends.includes(dayName);

    // Check if it's a holiday
    const isHoliday = holidayDates.has(dateStr);

    // Count as working day if not weekend and not holiday
    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Half day = 0.5 days
  if (isHalfDay && workingDays > 0) {
    return 0.5;
  }

  return workingDays;
};

/**
 * Get holidays in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} department - Department name
 * @returns {Promise<Array>} - Array of holidays
 */
const getHolidaysInRange = async (startDate, endDate, department = 'All') => {
  const holidays = await LeaveCalendar.find({
    date: { $gte: startDate, $lte: endDate },
    isWorkingDay: false,
    $or: [
      { applicableTo: 'All' },
      { department: department }
    ]
  });

  return holidays;
};

/**
 * Check if a date is a working day
 * @param {Date} date - Date to check
 * @param {string} department - Department
 * @returns {Promise<boolean>} - Is working day
 */
const isWorkingDay = async (date, department = 'All') => {
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

  // Check policy for weekends
  const policy = await LeavePolicy.getDefaultPolicy();
  const weekends = policy.weekends || ['Sunday'];

  if (weekends.includes(dayName)) {
    return false;
  }

  // Check if it's a holiday
  const holiday = await LeaveCalendar.findOne({
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    },
    isWorkingDay: false,
    $or: [
      { applicableTo: 'All' },
      { department: department }
    ]
  });

  return !holiday;
};

// ========================================
// LEAVE REQUEST FUNCTIONS
// ========================================

/**
 * Determine who should approve the leave request
 * Uses new hierarchical system based on direct employee assignments
 * @param {Object} employee - Employee document
 * @returns {Promise<Object>} - { approverRole, approverId, approverName }
 */
const determineLeaveApprover = async (employee) => {
  const { determineLeaveApprover: getApprover } = require('./hierarchyService');
  return await getApprover(employee._id);
};

/**
 * Create new leave request
 * @param {Object} leaveData - Leave request data
 * @param {string} empId - Employee ID
 * @returns {Promise<Object>} - Created leave request
 */
const createLeaveRequest = async (leaveData, empId) => {
  const { startDate, endDate, type: leaveType, reason, isHalfDay, halfDaySession, contactDuringLeave } = leaveData;

  // Get employee details
  const employee = await Employee.findOne({ empId });
  if (!employee) {
    throw new Error('Employee not found');
  }

  // Validate leave type
  const leaveTypeDoc = await LeaveType.findOne({ code: leaveType, isActive: true });
  if (!leaveTypeDoc) {
    throw new Error('Invalid leave type');
  }

  // Calculate working days
  const totalDays = await calculateWorkingDays(startDate, endDate, empId, isHalfDay);

  // Validate leave request
  await validateLeaveRequest({
    empId,
    leaveType,
    startDate,
    endDate,
    totalDays,
    employee
  });

  // Check balance sufficiency (only for AL)
  const balanceCheck = await checkBalanceSufficiency(empId, leaveType, totalDays);
  if (!balanceCheck.sufficient) {
    throw new Error(balanceCheck.message || 'Insufficient leave balance');
  }

  // Get current balance before request
  const currentBalance = await getEmployeeLeaveBalance(empId);
  const leaveBalance = currentBalance.getLeaveBalance(leaveType);
  const balanceBeforeRequest = leaveBalance ? leaveBalance.balance : 0;

  // Determine who should approve this leave request
  const approverInfo = await determineLeaveApprover(employee);

  // Create leave request with hierarchical approval
  const leaveRequest = await LeaveRequest.create({
    empId: employee.empId,
    empName: employee.empName,
    department: employee.department || '',
    leaveType,
    leaveTypeName: leaveTypeDoc.name,
    startDate,
    endDate,
    isHalfDay: isHalfDay || false,
    halfDaySession: halfDaySession || null,
    totalDays,
    reason,
    contactDuringLeave: contactDuringLeave || '',
    status: APP_CONSTANTS.LEAVE_STATUS.PENDING,
    appliedAt: new Date(),
    appliedBy: empId,
    balanceBeforeRequest,
    balanceAfterRequest: balanceBeforeRequest - totalDays,
    // Legacy fields (kept for backward compatibility)
    approverRole: approverInfo.approverRole,
    approverId: approverInfo.approverId,
    // New hierarchical approval fields
    currentApprover: approverInfo.approverId,
    currentApproverRole: approverInfo.approverRole,
    approvalChain: [{
      approverRole: approverInfo.approverRole,
      approverId: approverInfo.approverId,
      approverName: approverInfo.approverName,
      action: 'pending',
      reviewedAt: null,
      comment: null
    }]
  });

  // Reserve balance (only for AL)
  if (leaveType === 'AL') {
    await reserveLeaveBalance(empId, leaveType, totalDays);

    // Create transaction
    await LeaveTransaction.createTransaction({
      empId,
      empName: employee.empName,
      transactionType: 'reservation',
      leaveType,
      leaveTypeName: leaveTypeDoc.name,
      previousBalance: balanceBeforeRequest,
      changeAmount: 0, // No actual change yet, just reserved
      newBalance: balanceBeforeRequest,
      leaveRequestId: leaveRequest.leaveRequestId,
      remarks: `Leave request ${leaveRequest.leaveRequestId} pending approval - ${totalDays} days reserved`,
      performedBy: empId
    });
  }

  return leaveRequest;
};

/**
 * Validate leave request
 * @param {Object} data - Validation data
 * @returns {Promise<void>}
 */
const validateLeaveRequest = async (data) => {
  const { empId, leaveType, startDate, endDate, totalDays, employee } = data;

  // Get leave type configuration
  const leaveTypeDoc = await LeaveType.findOne({ code: leaveType });

  // Check if start date is in the past
  // All leave types now allow backdating
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // Backdating is now allowed for all leave types
  // No past date validation needed

  // Check advance notice requirement
  if (!leaveTypeDoc.isAdvanceNoticeValid(startDate)) {
    throw new Error(`This leave type requires ${leaveTypeDoc.minDaysAdvance} days advance notice`);
  }

  // Check max consecutive days
  if (leaveTypeDoc.maxConsecutiveDays > 0 && totalDays > leaveTypeDoc.maxConsecutiveDays) {
    throw new Error(`Maximum ${leaveTypeDoc.maxConsecutiveDays} consecutive days allowed for this leave type`);
  }

  // Check gender eligibility
  if (!leaveTypeDoc.isGenderEligible(employee.gender)) {
    throw new Error(`This leave type is only applicable for ${leaveTypeDoc.applicableGender}`);
  }

  // Check service eligibility
  if (employee.doj && leaveTypeDoc.minServiceMonths > 0) {
    const doj = new Date(employee.doj);
    const monthsOfService = (new Date() - doj) / (1000 * 60 * 60 * 24 * 30);

    if (monthsOfService < leaveTypeDoc.minServiceMonths) {
      throw new Error(`Minimum ${leaveTypeDoc.minServiceMonths} months of service required for this leave type`);
    }
  }

  // Check for overlapping leaves
  const overlappingLeaves = await getOverlappingLeaves(empId, startDate, endDate);
  if (overlappingLeaves.length > 0) {
    throw new Error('You already have a leave request for overlapping dates');
  }
};

/**
 * Get overlapping leave requests
 * @param {string} empId - Employee ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Overlapping leave requests
 */
const getOverlappingLeaves = async (empId, startDate, endDate) => {
  return await LeaveRequest.find({
    empId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      {
        startDate: { $gte: startDate, $lte: endDate }
      },
      {
        endDate: { $gte: startDate, $lte: endDate }
      },
      {
        startDate: { $lte: startDate },
        endDate: { $gte: endDate }
      }
    ]
  });
};

/**
 * Update leave request status (approve/reject)
 * @param {string} leaveId - Leave request ID
 * @param {string} status - New status
 * @param {string} decisionComment - Comment
 * @param {string} reviewedBy - Who reviewed
 * @returns {Promise<Object>} - Updated leave request
 */
const updateLeaveStatus = async (leaveId, status, decisionComment = '', reviewedBy = 'admin', approverId = null) => {
  const validStatuses = Object.values(APP_CONSTANTS.LEAVE_STATUS);

  if (!validStatuses.includes(status)) {
    throw new Error('Invalid leave status');
  }

  const leaveRequest = await LeaveRequest.findById(leaveId);
  if (!leaveRequest) {
    throw new Error('Leave request not found');
  }

  const previousStatus = leaveRequest.status;

  // Handle hierarchical approval
  if (status === 'approved' && leaveRequest.currentApprover && leaveRequest.currentApproverRole) {
    const { getNextApprover } = require('./hierarchyService');

    // Update current step in approval chain
    const currentStep = leaveRequest.approvalChain.find(
      step => step.approverId && step.approverId.toString() === leaveRequest.currentApprover.toString()
    );

    if (currentStep) {
      currentStep.action = 'approved';
      currentStep.reviewedAt = new Date();
      currentStep.comment = decisionComment;
    }

    // Get next approver in chain
    const nextApprover = await getNextApprover(leaveRequest.currentApprover, leaveRequest.currentApproverRole);

    if (nextApprover) {
      // Move to next approver in chain
      leaveRequest.currentApprover = nextApprover.approverId;
      leaveRequest.currentApproverRole = nextApprover.approverRole;

      // Add next step to approval chain
      leaveRequest.approvalChain.push({
        approverRole: nextApprover.approverRole,
        approverId: nextApprover.approverId,
        approverName: nextApprover.approverName,
        action: 'pending',
        reviewedAt: null,
        comment: null
      });

      // Keep status as pending (waiting for next approver)
      leaveRequest.status = 'pending';
      leaveRequest.reviewedBy = reviewedBy;
      leaveRequest.reviewedAt = new Date();
    } else {
      // Final approval - no more approvers in chain
      leaveRequest.status = 'approved';
      leaveRequest.decisionComment = `${decisionComment} - by ${reviewedBy}`;
      leaveRequest.reviewedBy = reviewedBy;
      leaveRequest.reviewedAt = new Date();

      leaveRequest.currentApprover = null;
      leaveRequest.currentApproverRole = null;
    }
  } else if (status === 'rejected') {
    // Rejection at any level terminates the chain
    leaveRequest.status = 'rejected';
    leaveRequest.decisionComment = `${decisionComment} - by ${reviewedBy}`;
    leaveRequest.reviewedBy = reviewedBy;
    leaveRequest.reviewedAt = new Date();

    // Update current step in approval chain
    const currentStep = leaveRequest.approvalChain.find(
      step => step.approverId && step.approverId.toString() === leaveRequest.currentApprover.toString()
    );

    if (currentStep) {
      currentStep.action = 'rejected';
      currentStep.reviewedAt = new Date();
      currentStep.comment = decisionComment;
    }

    leaveRequest.currentApprover = null;
    leaveRequest.currentApproverRole = null;
  } else {
    // Other status updates (backward compatibility)
    leaveRequest.status = status;
    leaveRequest.decisionComment = `${decisionComment} - by ${reviewedBy}`;
    leaveRequest.reviewedBy = reviewedBy;

    leaveRequest.reviewedAt = new Date();
  }

  await leaveRequest.save();

  // Handle balance updates (only on final approval or rejection)
  if (leaveRequest.status === 'approved' && previousStatus === 'pending') {
    // Move from pending to consumed (only for AL) - only when fully approved
    if (leaveRequest.leaveType === 'AL') {
      await consumeLeaveBalance(leaveRequest.empId, leaveRequest.leaveType, leaveRequest.totalDays);

      // Create transaction
      const leaveTypeDoc = await LeaveType.findOne({ code: leaveRequest.leaveType });
      const balance = await getEmployeeLeaveBalance(leaveRequest.empId);
      const leaveBalance = balance.getLeaveBalance(leaveRequest.leaveType);

      await LeaveTransaction.createTransaction({
        empId: leaveRequest.empId,
        empName: leaveRequest.empName,
        transactionType: 'consumption',
        leaveType: leaveRequest.leaveType,
        leaveTypeName: leaveTypeDoc.name,
        previousBalance: leaveRequest.balanceBeforeRequest,
        changeAmount: -leaveRequest.totalDays,
        newBalance: leaveBalance.balance,
        leaveRequestId: leaveRequest.leaveRequestId,
        effectiveDate: leaveRequest.startDate,
        remarks: `Leave request ${leaveRequest.leaveRequestId} fully approved - ${leaveRequest.totalDays} days consumed`,
        performedBy: reviewedBy
      });
    }
  } else if (leaveRequest.status === 'rejected' && previousStatus === 'pending') {
    // Release reserved balance (only for AL)
    if (leaveRequest.leaveType === 'AL') {
      await releaseLeaveBalance(leaveRequest.empId, leaveRequest.leaveType, leaveRequest.totalDays);

      // Create transaction
      const leaveTypeDoc = await LeaveType.findOne({ code: leaveRequest.leaveType });

      await LeaveTransaction.createTransaction({
        empId: leaveRequest.empId,
        empName: leaveRequest.empName,
        transactionType: 'release',
        leaveType: leaveRequest.leaveType,
        leaveTypeName: leaveTypeDoc.name,
        previousBalance: leaveRequest.balanceBeforeRequest,
        changeAmount: 0,
        newBalance: leaveRequest.balanceBeforeRequest,
        leaveRequestId: leaveRequest.leaveRequestId,
        remarks: `Leave request ${leaveRequest.leaveRequestId} rejected - balance released`,
        performedBy: reviewedBy
      });
    }
  }

  return leaveRequest;
};

/**
 * Cancel leave request (by employee)
 * @param {string} leaveId - Leave request ID
 * @param {string} empId - Employee ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} - Updated leave request
 */
const cancelLeaveRequest = async (leaveId, empId, reason = '') => {
  const leaveRequest = await LeaveRequest.findById(leaveId);

  if (!leaveRequest) {
    throw new Error('Leave request not found');
  }

  if (leaveRequest.empId !== empId) {
    throw new Error('Not authorized to cancel this leave request');
  }

  if (!leaveRequest.canBeCancelled()) {
    throw new Error('This leave request cannot be cancelled');
  }

  const previousStatus = leaveRequest.status;

  // Update status to cancelled
  leaveRequest.status = 'cancelled';
  leaveRequest.cancelledBy = empId;
  leaveRequest.cancelledAt = new Date();
  leaveRequest.cancellationReason = reason;

  await leaveRequest.save();

  // Handle balance restoration (only for AL)
  if (leaveRequest.leaveType === 'AL') {
    if (previousStatus === 'pending') {
      // Release reserved balance
      await releaseLeaveBalance(empId, leaveRequest.leaveType, leaveRequest.totalDays);
    } else if (previousStatus === 'approved') {
      // Add back to balance
      const balance = await getEmployeeLeaveBalance(empId);
      const leaveBalance = balance.getLeaveBalance(leaveRequest.leaveType);

      leaveBalance.consumed -= leaveRequest.totalDays;
      leaveBalance.balance = leaveBalance.accrued - leaveBalance.consumed - leaveBalance.pending;

      await balance.save();
    }

    // Create transaction
    const leaveTypeDoc = await LeaveType.findOne({ code: leaveRequest.leaveType });
    const balance = await getEmployeeLeaveBalance(empId);
    const leaveBalance = balance.getLeaveBalance(leaveRequest.leaveType);

    await LeaveTransaction.createTransaction({
      empId,
      empName: leaveRequest.empName,
      transactionType: 'cancellation',
      leaveType: leaveRequest.leaveType,
      leaveTypeName: leaveTypeDoc.name,
      previousBalance: leaveRequest.balanceAfterRequest,
      changeAmount: +leaveRequest.totalDays,
      newBalance: leaveBalance.balance,
      leaveRequestId: leaveRequest.leaveRequestId,
      remarks: `Leave request ${leaveRequest.leaveRequestId} cancelled - balance restored`,
      performedBy: empId
    });
  }

  return leaveRequest;
};

/**
 * Get leave requests by user
 * @param {string} empId - Employee ID
 * @param {Object} filter - Additional filters
 * @returns {Promise<Array>} - Leave requests
 */
const getLeavesByEmployee = async (empId, filter = {}) => {
  const leaves = await LeaveRequest.find({ empId, ...filter })
    .sort({ createdAt: -1 });
  return leaves;
};

/**
 * Get all leave requests
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - Leave requests
 */
const getAllLeaveRequests = async (filter = {}) => {
  const leaves = await LeaveRequest.find(filter)
    .sort({ createdAt: -1 });
  return leaves;
};

/**
 * Get leave request by ID
 * @param {string} leaveId - Leave request ID
 * @returns {Promise<Object>} - Leave request
 */
const getLeaveById = async (leaveId) => {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) {
    throw new Error('Leave request not found');
  }
  return leave;
};

// ========================================
// ACCRUAL FUNCTIONS
// ========================================

/**
 * Monthly leave accrual (to be run as cron job)
 * Accrues 1 day/month + 1 bonus on quarters (Mar, Jun, Sep, Dec)
 * @returns {Promise<Object>} - Accrual summary
 */
const accrueMonthlyLeaves = async () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  console.log(`🔄 Running monthly leave accrual for ${currentMonth}/${currentYear}...`);

  const employees = await Employee.find({ empStatus: 'W' }); // Only working employees
  const results = {
    success: 0,
    skipped: 0,
    errors: []
  };

  // Check if this is a quarter month (3, 6, 9, 12)
  const isQuarterMonth = [3, 6, 9, 12].includes(currentMonth);
  const accrualAmount = isQuarterMonth ? 2 : 1; // 1 regular + 1 bonus on quarters

  for (const employee of employees) {
    try {
      let balance = await EmployeeLeaveBalance.findOne({
        empId: employee.empId,
        year: currentYear
      });

      if (!balance) {
        // Initialize balance if not exists
        balance = await initializeEmployeeLeaveBalance(employee.empId, currentYear);
      }

      const alBalance = balance.getLeaveBalance('AL');
      if (!alBalance) continue;

      const previousBalance = alBalance.accrued;

      // Add accrual
      alBalance.accrued += accrualAmount;
      alBalance.balance = alBalance.accrued - alBalance.consumed - alBalance.pending;
      alBalance.lastAccrualDate = currentDate;
      alBalance.nextAccrualDate = new Date(currentYear, currentMonth, 1); // Next month 1st

      await balance.save();

      // Create transaction
      await LeaveTransaction.createTransaction({
        empId: employee.empId,
        empName: employee.empName,
        transactionType: 'accrual',
        leaveType: 'AL',
        leaveTypeName: 'Annual Leave',
        previousBalance,
        changeAmount: accrualAmount,
        newBalance: alBalance.accrued,
        remarks: isQuarterMonth
          ? `Monthly accrual (1 day) + Quarterly bonus (1 day) for ${currentMonth}/${currentYear}`
          : `Monthly accrual for ${currentMonth}/${currentYear}`,
        performedBy: 'system'
      });

      results.success++;

    } catch (error) {
      console.error(`Error accruing leaves for ${employee.empId}:`, error.message);
      results.errors.push({ empId: employee.empId, error: error.message });
    }
  }

  console.log(`✅ Accrual complete: ${results.success} employees, ${results.errors.length} errors`);
  return results;
};

// ========================================
// EXPORT ALL FUNCTIONS
// ========================================

module.exports = {
  // Leave Balance
  getEmployeeLeaveBalance,
  initializeEmployeeLeaveBalance,
  updateLeaveBalance,
  reserveLeaveBalance,
  releaseLeaveBalance,
  consumeLeaveBalance,
  checkBalanceSufficiency,

  // Working Days
  calculateWorkingDays,
  getHolidaysInRange,
  isWorkingDay,

  // Leave Requests
  createLeaveRequest,
  validateLeaveRequest,
  getOverlappingLeaves,
  updateLeaveStatus,
  cancelLeaveRequest,
  getLeavesByEmployee,
  getAllLeaveRequests,
  getLeaveById,
  determineLeaveApprover,

  // Accrual
  accrueMonthlyLeaves
};
