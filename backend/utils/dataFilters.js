/**
 * Data Filtering Utilities
 * Functions to filter data based on user role and permissions
 */

const { ROLES, canViewSalary } = require('./rolePermissions');

/**
 * Remove salary-related fields from employee data
 * @param {Object} employee - Employee document or object
 * @returns {Object} - Employee data without salary fields
 */
const removeSalaryFields = (employee) => {
  if (!employee) return null;
  
  const employeeObj = employee.toObject ? employee.toObject() : { ...employee };
  
  // Remove salary-related fields
  delete employeeObj.hiredCtc;
  delete employeeObj.joiningCtc;
  delete employeeObj.ctc2025;
  delete employeeObj.settlementAmount;
  
  return employeeObj;
};

/**
 * Filter employee data based on user role
 * @param {Object|Array} data - Employee data (single or array)
 * @param {string} role - User role
 * @returns {Object|Array} - Filtered employee data
 */
const filterEmployeeData = (data, role) => {
  if (!data) return null;
  
  // Admin roles can see all data
  if (canViewSalary(role)) {
    return data;
  }
  
  // Director and HOD cannot see salary information
  if (Array.isArray(data)) {
    return data.map(employee => removeSalaryFields(employee));
  } else {
    return removeSalaryFields(data);
  }
};

/**
 * Build query filter based on user role and context
 * @param {string} role - User role
 * @param {Object} user - User object with employeeId
 * @param {string} resourceType - Type of resource (employee, leave, attendance, etc.)
 * @returns {Object} - MongoDB query filter
 * Note: For HODs, this now uses hierarchical employee assignments instead of departments
 */
const buildQueryFilter = (role, user, resourceType = 'employee') => {
  const filter = {};
  
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.HRMS_HANDLER:
    case ROLES.DIRECTOR:
      // No filter - can view all
      break;
      
    case ROLES.HOD:
      // HODs now use direct employee assignments, not departments
      // Filtering by assigned employees is handled at the controller level
      // using the hierarchyService functions
      // For now, return empty filter to allow the controller to handle it
      if (resourceType === 'employee') {
        filter.empStatus = 'W'; // Only working employees
      }
      break;
      
    case ROLES.EMPLOYEE:
      // Only own data
      if (user.employeeId) {
        if (resourceType === 'employee') {
          filter._id = user.employeeId;
        } else if (resourceType === 'leave' || resourceType === 'attendance' || resourceType === 'asset') {
          filter.empId = user.employeeId;
        } else if (resourceType === 'salary' || resourceType === 'slip') {
          filter.empId = user.employeeId;
        }
      }
      break;
      
    default:
      // Unknown role - return filter that matches nothing
      filter._id = null;
  }
  
  return filter;
};

/**
 * Check if user can access specific employee data
 * @param {string} role - User role
 * @param {Object} user - User object
 * @param {string} targetEmployeeId - Employee ID being accessed
 * @param {string} targetDepartment - Employee's department (deprecated, kept for compatibility)
 * @returns {boolean}
 * Note: For HODs, actual permission checking is done at controller level using hierarchyService
 */
const canAccessEmployeeData = (role, user, targetEmployeeId, targetDepartment) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.HRMS_HANDLER:
    case ROLES.DIRECTOR:
      return true;
      
    case ROLES.HOD:
      // For HODs, allow controller to handle the check using hierarchyService
      // This function is kept for backward compatibility
      return true; // Actual check happens at controller level
      
    case ROLES.EMPLOYEE:
      // Can only access own data
      return user.employeeId && user.employeeId.toString() === targetEmployeeId.toString();
      
    default:
      return false;
  }
};

/**
 * Check if user can approve leave request
 * @param {string} role - User role
 * @param {Object} user - User object
 * @param {Object} leaveRequest - Leave request object
 * @returns {boolean}
 * Note: For HODs and Directors, use hierarchyService.canApproveLeave() instead
 * This function is kept for backward compatibility only
 */
const canApproveLeave = (role, user, leaveRequest) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.HRMS_HANDLER:
      return true;
      
    case ROLES.HOD:
    case ROLES.DIRECTOR:
      // For HODs and Directors, permission is checked at controller level
      // using the hierarchyService.canApproveLeave() function
      return true; // Actual check happens at controller level
      
    default:
      return false;
  }
};

/**
 * Filter leave requests based on user role
 * @param {Array} leaveRequests - Array of leave requests
 * @param {string} role - User role
 * @param {Object} user - User object
 * @returns {Array} - Filtered leave requests
 * Note: For HODs and Directors, use hierarchyService.getApprovableLeaveRequests() instead
 * This function is kept for backward compatibility
 */
const filterLeaveRequests = (leaveRequests, role, user) => {
  if (!leaveRequests || !Array.isArray(leaveRequests)) {
    return [];
  }
  
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.HRMS_HANDLER:
    case ROLES.DIRECTOR:
    case ROLES.HOD:
      // For HODs and Directors, filtering is handled at controller level
      // using hierarchyService functions
      return leaveRequests;
      
    case ROLES.EMPLOYEE:
      // Only own requests
      return leaveRequests.filter(req => 
        req.empId && 
        req.empId._id.toString() === user.employeeId.toString()
      );
      
    default:
      return [];
  }
};

/**
 * Remove sensitive fields from user object for response
 * @param {Object} user - User document
 * @returns {Object} - Safe user object
 */
const sanitizeUserData = (user) => {
  if (!user) return null;
  
  const userObj = user.toObject ? user.toObject() : { ...user };
  
  // Remove sensitive fields
  delete userObj.password;
  delete userObj.resetToken;
  delete userObj.resetTokenExpiry;
  
  return userObj;
};

/**
 * Get population options based on role
 * @param {string} role - User role
 * @returns {Object} - Populate options for mongoose
 */
const getPopulateOptions = (role) => {
  const options = {
    path: 'empId',
    select: '-__v'
  };
  
  // Exclude salary fields for director and hod
  if (role === ROLES.DIRECTOR || role === ROLES.HOD) {
    options.select += ' -hiredCtc -joiningCtc -ctc2025 -settlementAmount';
  }
  
  return options;
};

/**
 * Check if user can modify employee data
 * @param {string} role - User role
 * @returns {boolean}
 */
const canModifyEmployeeData = (role) => {
  return [ROLES.SUPER_ADMIN, ROLES.HRMS_HANDLER].includes(role);
};

/**
 * Check if user can delete resources
 * @param {string} role - User role
 * @returns {boolean}
 */
const canDeleteResources = (role) => {
  return role === ROLES.SUPER_ADMIN;
};

/**
 * Get accessible employee IDs for a user
 * Used for bulk operations and filtering
 * @param {string} role - User role
 * @param {Object} user - User object
 * @param {Array} allEmployees - All employees array
 * @returns {Array} - Array of accessible employee IDs
 * Note: For HODs, use hierarchyService.getReportingEmployees() instead
 * This function is kept for backward compatibility
 */
const getAccessibleEmployeeIds = (role, user, allEmployees) => {
  if (!Array.isArray(allEmployees)) {
    return [];
  }
  
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.HRMS_HANDLER:
    case ROLES.DIRECTOR:
    case ROLES.HOD:
      // For HODs and Directors, return all employee IDs
      // Filtering is handled at controller level using hierarchyService
      return allEmployees.map(emp => emp._id.toString());
      
    case ROLES.EMPLOYEE:
      return user.employeeId ? [user.employeeId.toString()] : [];
      
    default:
      return [];
  }
};

/**
 * Apply role-based transformations to response data
 * @param {any} data - Response data
 * @param {string} role - User role
 * @param {string} dataType - Type of data (employee, salary, leave, etc.)
 * @returns {any} - Transformed data
 */
const transformResponseData = (data, role, dataType) => {
  if (!data) return data;
  
  switch (dataType) {
    case 'employee':
    case 'employees':
      return filterEmployeeData(data, role);
      
    case 'user':
    case 'users':
      return Array.isArray(data) 
        ? data.map(sanitizeUserData)
        : sanitizeUserData(data);
      
    default:
      return data;
  }
};

module.exports = {
  removeSalaryFields,
  filterEmployeeData,
  buildQueryFilter,
  canAccessEmployeeData,
  canApproveLeave,
  filterLeaveRequests,
  sanitizeUserData,
  getPopulateOptions,
  canModifyEmployeeData,
  canDeleteResources,
  getAccessibleEmployeeIds,
  transformResponseData
};

