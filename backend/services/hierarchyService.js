const User = require('../models/User');
const Employee = require('../models/Employee');

/**
 * Determine the appropriate approver for an employee's leave request
 * Returns: { approverId, approverRole, approverName }
 */
const determineLeaveApprover = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate('reportingToHOD', 'username role')
    .populate('reportingToDirector', 'username role');

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Priority 1: If employee has an HOD, leave goes to HOD
  if (employee.reportingToHOD) {
    return {
      approverId: employee.reportingToHOD._id,
      approverRole: 'hod',
      approverName: employee.reportingToHOD.username
    };
  }

  // Priority 2: If employee has a Director (but no HOD), leave goes to Director
  if (employee.reportingToDirector) {
    return {
      approverId: employee.reportingToDirector._id,
      approverRole: 'director',
      approverName: employee.reportingToDirector.username
    };
  }

  // Priority 3: If no HOD or Director, leave goes to HRMS Handler
  const hrmsHandler = await User.findOne({ 
    role: 'hrms_handler', 
    isActive: true 
  }).sort({ createdAt: 1 });

  if (hrmsHandler) {
    return {
      approverId: hrmsHandler._id,
      approverRole: 'hrms_handler',
      approverName: hrmsHandler.username
    };
  }

  // Fallback: Super Admin
  const superAdmin = await User.findOne({ 
    role: 'super_admin', 
    isActive: true 
  }).sort({ createdAt: 1 });

  if (superAdmin) {
    return {
      approverId: superAdmin._id,
      approverRole: 'super_admin',
      approverName: superAdmin.username
    };
  }

  throw new Error('No approver found for this employee');
};

/**
 * Determine the next approver in the chain after current approval
 * For HOD: returns Director if HOD has one
 * For Director: returns null (final approver)
 */
const getNextApprover = async (currentApproverId, currentApproverRole) => {
  // If current approver is Director, HRMS Handler, or Super Admin - no next approver
  if (['director', 'hrms_handler', 'super_admin'].includes(currentApproverRole)) {
    return null;
  }

  // If current approver is HOD, check if HOD reports to a Director
  if (currentApproverRole === 'hod') {
    const hod = await User.findById(currentApproverId)
      .populate('reportsTo', 'username role');

    if (hod && hod.reportsTo && hod.reportsTo.role === 'director') {
      return {
        approverId: hod.reportsTo._id,
        approverRole: 'director',
        approverName: hod.reportsTo.username
      };
    }

    // If HOD has no Director, approval is final
    return null;
  }

  return null;
};

/**
 * Check if a user can approve a leave request
 */
const canApproveLeave = async (userId, leaveRequest) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    return { canApprove: false, reason: 'User not found or inactive' };
  }

  // Super admin and HRMS handler can approve any leave
  if (['super_admin', 'hrms_handler'].includes(user.role)) {
    return { canApprove: true };
  }

  // Check if user is the current approver
  if (leaveRequest.currentApprover && 
      leaveRequest.currentApprover.toString() === userId) {
    return { canApprove: true };
  }

  // For HOD: Check if leave is from one of their assigned employees
  if (user.role === 'hod') {
    const employee = await Employee.findOne({ empId: leaveRequest.empId });
    
    if (employee && employee.reportingToHOD && 
        employee.reportingToHOD.toString() === userId) {
      return { canApprove: true };
    }

    return { 
      canApprove: false, 
      reason: 'This employee is not assigned to you' 
    };
  }

  // For Director: Check if leave is from their assigned HOD's employees or direct employees
  if (user.role === 'director') {
    const employee = await Employee.findOne({ empId: leaveRequest.empId });
    
    if (!employee) {
      return { canApprove: false, reason: 'Employee not found' };
    }

    // Check if employee reports directly to this director
    if (employee.reportingToDirector && 
        employee.reportingToDirector.toString() === userId) {
      return { canApprove: true };
    }

    // Check if employee's HOD reports to this director
    if (employee.reportingToHOD) {
      const hod = await User.findById(employee.reportingToHOD);
      if (hod && hod.reportsTo && hod.reportsTo.toString() === userId) {
        return { canApprove: true };
      }
    }

    return { 
      canApprove: false, 
      reason: 'This employee is not in your reporting hierarchy' 
    };
  }

  return { canApprove: false, reason: 'Insufficient permissions' };
};

/**
 * Get all employees reporting to a user (direct and indirect)
 */
const getReportingEmployees = async (userId, role) => {
  if (role === 'hod') {
    // Get all employees directly assigned to this HOD
    const employees = await Employee.find({
      reportingToHOD: userId,
      empStatus: 'W'
    }).sort({ empName: 1 });

    return employees;
  }

  if (role === 'director') {
    const director = await User.findById(userId)
      .populate('assignedHODs')
      .populate('assignedDirectEmployees');

    if (!director) {
      return [];
    }

    // Get direct employees
    const directEmployees = await Employee.find({
      reportingToDirector: userId,
      empStatus: 'W'
    });

    // Get employees from assigned HODs
    const hodIds = director.assignedHODs.map(hod => hod._id);
    const hodEmployees = await Employee.find({
      reportingToHOD: { $in: hodIds },
      empStatus: 'W'
    });

    // Combine and deduplicate
    const allEmployees = [...directEmployees, ...hodEmployees];
    const uniqueEmployees = Array.from(
      new Map(allEmployees.map(emp => [emp._id.toString(), emp])).values()
    );

    return uniqueEmployees.sort((a, b) => a.empName.localeCompare(b.empName));
  }

  if (['hrms_handler', 'super_admin'].includes(role)) {
    // Can see all employees
    const employees = await Employee.find({
      empStatus: 'W'
    }).sort({ empName: 1 });

    return employees;
  }

  return [];
};

/**
 * Get all leave requests that a user can approve
 */
const getApprovableLeaveRequests = async (userId, role) => {
  const LeaveRequest = require('../models/LeaveRequest');

  if (['super_admin', 'hrms_handler'].includes(role)) {
    // Can approve all leaves
    return await LeaveRequest.find({ status: 'pending' })
      .sort({ appliedAt: -1 });
  }

  if (role === 'hod') {
    // Get employees assigned to this HOD
    const employees = await Employee.find({
      reportingToHOD: userId,
      empStatus: 'W'
    });

    const empIds = employees.map(emp => emp.empId);

    // Get leave requests from these employees where HOD is the current approver
    return await LeaveRequest.find({
      empId: { $in: empIds },
      status: 'pending',
      $or: [
        { currentApprover: userId },
        { currentApproverRole: 'hod' }
      ]
    }).sort({ appliedAt: -1 });
  }

  if (role === 'director') {
    // Get all employees in director's hierarchy
    const employees = await getReportingEmployees(userId, role);
    const empIds = employees.map(emp => emp.empId);

    // Get leave requests where director is the current approver
    return await LeaveRequest.find({
      empId: { $in: empIds },
      status: 'pending',
      $or: [
        { currentApprover: userId },
        { currentApproverRole: 'director' }
      ]
    }).sort({ appliedAt: -1 });
  }

  return [];
};

/**
 * Validate if employee can send leave to specific approver
 */
const validateLeaveSubmission = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate('reportingToHOD', 'username')
    .populate('reportingToDirector', 'username');

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!employee.reportingToHOD && !employee.reportingToDirector) {
    throw new Error('You are not assigned to any HOD or Director. Please contact HR.');
  }

  return {
    valid: true,
    approver: employee.reportingToHOD || employee.reportingToDirector
  };
};

/**
 * Get hierarchy information for an employee
 */
const getEmployeeHierarchy = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate('reportingToHOD', 'username email role')
    .populate('reportingToDirector', 'username email role');

  if (!employee) {
    throw new Error('Employee not found');
  }

  const hierarchy = {
    employee: {
      _id: employee._id,
      empId: employee.empId,
      empName: employee.empName,
      department: employee.department
    },
    immediateManager: null,
    director: null,
    chain: []
  };

  if (employee.reportingToHOD) {
    hierarchy.immediateManager = {
      _id: employee.reportingToHOD._id,
      username: employee.reportingToHOD.username,
      email: employee.reportingToHOD.email,
      role: 'hod'
    };
    hierarchy.chain.push(hierarchy.immediateManager);

    // Check if HOD has a director
    const hod = await User.findById(employee.reportingToHOD._id)
      .populate('reportsTo', 'username email role');

    if (hod && hod.reportsTo) {
      hierarchy.director = {
        _id: hod.reportsTo._id,
        username: hod.reportsTo.username,
        email: hod.reportsTo.email,
        role: 'director'
      };
      hierarchy.chain.push(hierarchy.director);
    }
  } else if (employee.reportingToDirector) {
    hierarchy.immediateManager = {
      _id: employee.reportingToDirector._id,
      username: employee.reportingToDirector.username,
      email: employee.reportingToDirector.email,
      role: 'director'
    };
    hierarchy.director = hierarchy.immediateManager;
    hierarchy.chain.push(hierarchy.immediateManager);
  }

  return hierarchy;
};

module.exports = {
  determineLeaveApprover,
  getNextApprover,
  canApproveLeave,
  getReportingEmployees,
  getApprovableLeaveRequests,
  validateLeaveSubmission,
  getEmployeeHierarchy
};

