const asyncHandler = require('../middleware/asyncHandler');
const {
  createLeaveRequest,
  getLeavesByEmployee,
  getAllLeaveRequests,
  getLeaveById,
  updateLeaveStatus: updateLeaveStatusService,
  cancelLeaveRequest: cancelLeaveRequestService,
  getEmployeeLeaveBalance,
  updateLeaveBalance,
  calculateWorkingDays
} = require('../services/leaveService');

/**
 * @desc    Apply for leave
 * @route   POST /api/leaves/request
 * @access  Private (Employee)
 */
const applyLeave = asyncHandler(async (req, res) => {
  const { empId, startDate, endDate, type: leaveType, reason, isHalfDay, halfDaySession, contactDuringLeave } = req.body;

  // Validation
  if (!empId || !startDate || !endDate || !leaveType || !reason) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide all required fields: empId, startDate, endDate, type, reason' 
    });
  }

  try {
    const leave = await createLeaveRequest({
      startDate,
      endDate,
      type: leaveType,
      reason,
      isHalfDay,
      halfDaySession,
      contactDuringLeave
    }, empId);

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get my leave requests
 * @route   GET /api/leaves/my-requests
 * @access  Private (Employee)
 */
const getMyLeaves = asyncHandler(async (req, res) => {
  const { empId } = req.query;
  const { status } = req.query;

  if (!empId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required'
    });
  }

  const filter = status ? { status } : {};
  const leaves = await getLeavesByEmployee(empId, filter);

  res.status(200).json({
    success: true,
    count: leaves.length,
    data: leaves
  });
});

/**
 * @desc    Get all leave requests (with hierarchical filtering)
 * @route   GET /api/leaves/requests
 * @access  Private (Admin, Director, HOD)
 */
const listAllRequests = asyncHandler(async (req, res) => {
  const { status, empId, leaveType } = req.query;
  const { role, id: userId } = req.user;
  
  const filter = {};
  if (status) filter.status = status;
  if (empId) filter.empId = empId;
  if (leaveType) filter.leaveType = leaveType;
  
  let leaves = await getAllLeaveRequests(filter);

  // Apply hierarchical filtering for HODs and Directors
  if (role === 'hod' || role === 'director') {
    const { getReportingEmployees } = require('../services/hierarchyService');
    const reportingEmployees = await getReportingEmployees(userId, role);
    const reportingEmpIds = reportingEmployees.map(emp => emp.empId);
    
    // Filter leaves to only show those from reporting employees
    leaves = leaves.filter(leave => reportingEmpIds.includes(leave.empId));
  }

  // Return array directly for backward compatibility with frontend
  res.status(200).json(leaves);
});

/**
 * @desc    Get leave request by ID
 * @route   GET /api/leaves/requests/:id
 * @access  Private
 */
const getLeaveDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const leave = await getLeaveById(id);

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Approve leave request
 * @route   PUT /api/leaves/requests/:id/approve
 * @access  Private (HOD, Director, Admin)
 */
const approveLeave = asyncHandler(async (req, res) => {

  // 🚫 HRMS CANNOT APPROVE
  if (!['hod', 'director'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only HOD or Director can approve leave requests'
    });
  }
  const { id } = req.params;
  const { decisionComment, reviewedBy } = req.body;
  const userId = req.user?.id || req.user?._id;

  try {
    // Verify user can approve this leave
    const { canApproveLeave } = require('../services/hierarchyService');
    const LeaveRequest = require('../models/LeaveRequest');
    const leaveRequest = await LeaveRequest.findById(id);
    
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const canApprove = await canApproveLeave(userId, leaveRequest);
    
    if (!canApprove.canApprove) {
      return res.status(403).json({
        success: false,
        message: canApprove.reason || 'You do not have permission to approve this leave request'
      });
    }

const approverName =
  req.user?.name ||
  req.user?.displayName ||
  'HOD';

const updated = await updateLeaveStatusService(
  id,
  'approved',
  decisionComment || 'Approved',
  approverName,
  userId
);

    // Check if this was final approval or moved to next approver
    const isFinalApproval = updated.status === 'approved';
    const message = isFinalApproval 
      ? 'Leave request approved successfully' 
      : 'Leave request approved and forwarded to next approver';

    res.status(200).json({
      success: true,
      message,
      isFinalApproval,
      data: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Reject leave request
 * @route   PUT /api/leaves/requests/:id/reject
 * @access  Private (HOD, Director, Admin)
 */
const rejectLeave = asyncHandler(async (req, res) => {

  // 🚫 HRMS CANNOT REJECT
  if (!['hod', 'director'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only HOD or Director can reject leave requests'
    });
  }
  const { id } = req.params;
  const { decisionComment, reviewedBy } = req.body;
  const userId = req.user?.id || req.user?._id;

  if (!decisionComment) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a reason for rejection'
    });
  }

  try {
    // Verify user can reject this leave
    const { canApproveLeave } = require('../services/hierarchyService');
    const LeaveRequest = require('../models/LeaveRequest');
    const leaveRequest = await LeaveRequest.findById(id);
    
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const canApprove = await canApproveLeave(userId, leaveRequest);
    
    if (!canApprove.canApprove) {
      return res.status(403).json({
        success: false,
        message: canApprove.reason || 'You do not have permission to reject this leave request'
      });
    }
const approverName =
  req.user?.name ||
  req.user?.displayName ||
  'HOD';

const updated = await updateLeaveStatusService(
  id,
  'rejected',
  decisionComment,
  approverName,
  userId
);


    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Update leave request status (generic)
 * @route   PUT /api/leaves/:id/status
 * @access  Private (Admin/HOD)
 */
const updateLeaveStatus = asyncHandler(async (req, res) => {

  if (!['hod', 'director'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only HOD or Director can change leave status'
    });
  }

  const { id } = req.params;
  const { status, decisionComment } = req.body;


  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be either "approved" or "rejected"'
    });
  }

  if (status === 'rejected' && !decisionComment) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a reason for rejection'
    });
  }

  try {
const approverName =
  req.user?.name ||
  req.user?.displayName ||
  'Admin';

const updated = await updateLeaveStatusService(
  id,
  status,
  decisionComment || (status === 'approved' ? 'Approved' : 'Rejected'),
  approverName
);

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Cancel leave request (by employee)
 * @route   PUT /api/leaves/requests/:id/cancel
 * @access  Private (Employee)
 */
const cancelLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { empId, cancellationReason } = req.body;

  if (!empId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required'
    });
  }

  try {
    const updated = await cancelLeaveRequestService(id, empId, cancellationReason || '');

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get my leave balance
 * @route   GET /api/leaves/balance
 * @access  Private (Employee)
 */
const getMyLeaveBalance = asyncHandler(async (req, res) => {
  const { empId } = req.query;

  if (!empId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required'
    });
  }

  try {
    const balance = await getEmployeeLeaveBalance(empId);

    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get employee leave balance (Admin)
 * @route   GET /api/leaves/balance/:empId
 * @access  Private (Admin)
 */
const getEmployeeBalance = asyncHandler(async (req, res) => {
  const { empId } = req.params;

  try {
    const balance = await getEmployeeLeaveBalance(empId);

    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Adjust leave balance manually (Admin)
 * @route   POST /api/leaves/balance/adjust
 * @access  Private (Admin)
 */
const adjustLeaveBalance = asyncHandler(async (req, res) => {
  const { empId, leaveType, adjustment, remarks } = req.body;

  if (!empId || !leaveType || adjustment === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide empId, leaveType, and adjustment amount'
    });
  }

  try {
    const balance = await getEmployeeLeaveBalance(empId);
    const leaveBalance = balance.getLeaveBalance(leaveType);

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message: `Leave type ${leaveType} not found for employee`
      });
    }

    const previousBalance = leaveBalance.accrued;

    // Apply adjustment
    leaveBalance.accrued += adjustment;
    leaveBalance.balance = leaveBalance.accrued - leaveBalance.consumed - leaveBalance.pending;

    await balance.save();

    // Create transaction
    const LeaveTransaction = require('../models/LeaveTransaction');
    await LeaveTransaction.createTransaction({
      empId,
      empName: balance.empName,
      transactionType: 'adjustment',
      leaveType,
      leaveTypeName: leaveBalance.leaveTypeName,
      previousBalance,
      changeAmount: adjustment,
      newBalance: leaveBalance.accrued,
      remarks: remarks || 'Manual adjustment by admin',
      performedBy: req.user?.email || 'admin'
    });

    res.status(200).json({
      success: true,
      message: 'Leave balance adjusted successfully',
      data: balance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Calculate working days between dates
 * @route   POST /api/leaves/calculate-working-days
 * @access  Private
 */
const calculateWorkingDaysEndpoint = asyncHandler(async (req, res) => {
  const { startDate, endDate, empId, isHalfDay } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide startDate and endDate'
    });
  }

  try {
    const workingDays = await calculateWorkingDays(startDate, endDate, empId, isHalfDay);

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        workingDays,
        isHalfDay: isHalfDay || false
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get leave requests for current user's approval
 * @route   GET /api/leaves/my-approvals
 * @access  Private (HOD, Director, Admin)
 */
const getMyApprovals = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  try {
    const { getApprovableLeaveRequests } = require('../services/hierarchyService');
    const leaves = await getApprovableLeaveRequests(userId, userRole);

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get employee hierarchy information
 * @route   GET /api/leaves/hierarchy/:employeeId
 * @access  Private
 */
const getEmployeeHierarchy = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  try {
    const { getEmployeeHierarchy: getHierarchy } = require('../services/hierarchyService');
    const hierarchy = await getEmployeeHierarchy(employeeId);

    res.status(200).json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  updateLeaveStatus, 
  applyLeave,
  getMyLeaves, 
  listAllRequests, 
  getLeaveDetails,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getMyLeaveBalance,
  getEmployeeBalance,
  adjustLeaveBalance,
  calculateWorkingDaysEndpoint,
  getMyApprovals,
  getEmployeeHierarchy
};
