const { isValidEmail, isValidPhone, isValidArray } = require('./helpers');

/**
 * Validate employee data
 * @param {Object} employeeData - Employee data to validate
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateEmployee = (employeeData) => {
  const errors = [];
  
  if (!employeeData.empId || String(employeeData.empId).trim() === '') {
    errors.push('Employee ID is required');
  }
  
  if (!employeeData.empName || String(employeeData.empName).trim() === '') {
    errors.push('Employee name is required');
  }
  
  if (!employeeData.empUnit || String(employeeData.empUnit).trim() === '') {
    errors.push('Employee unit is required');
  }
  
  if (employeeData.personalEmail && !isValidEmail(employeeData.personalEmail)) {
    errors.push('Invalid personal email format');
  }
  
  if (employeeData.officialEmail && !isValidEmail(employeeData.officialEmail)) {
    errors.push('Invalid official email format');
  }
  
  if (employeeData.contactNo && !isValidPhone(employeeData.contactNo)) {
    errors.push('Invalid contact number (must be 10 digits)');
  }
  
  if (employeeData.emergencyContact && !isValidPhone(employeeData.emergencyContact)) {
    errors.push('Invalid emergency contact (must be 10 digits)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login credentials
 * @param {Object} credentials - Login credentials
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateLogin = (credentials) => {
  const errors = [];
  
  if (!credentials.email || !isValidEmail(credentials.email)) {
    errors.push('Valid email is required');
  }
  
  if (!credentials.password || credentials.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate leave request
 * @param {Object} leaveData - Leave request data
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateLeaveRequest = (leaveData) => {
  const errors = [];
  
  if (!leaveData.startDate) {
    errors.push('Start date is required');
  }
  
  if (!leaveData.endDate) {
    errors.push('End date is required');
  }
  
  if (!leaveData.type) {
    errors.push('Leave type is required');
  }
  
  if (!leaveData.reason || String(leaveData.reason).trim() === '') {
    errors.push('Reason is required');
  }
  
  if (leaveData.startDate && leaveData.endDate) {
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate salary data
 * @param {Object} salaryData - Salary data to validate
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateSalary = (salaryData) => {
  const errors = [];
  
  if (!salaryData.empId) {
    errors.push('Employee ID is required');
  }
  
  if (!salaryData.year || salaryData.year < 2000 || salaryData.year > 2100) {
    errors.push('Valid year is required');
  }
  
  if (!salaryData.month) {
    errors.push('Month is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file upload
 * @param {Object} file - Uploaded file object
 * @param {Array} allowedTypes - Array of allowed file extensions
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateFileUpload = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  if (allowedTypes.length > 0) {
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    errors.push(`File size must not exceed ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate pagination parameters
 * @param {*} page - Page number
 * @param {*} limit - Items per page
 * @returns {Object} - { page: number, limit: number }
 */
const validatePagination = (page, limit) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(1000, Math.max(1, parseInt(limit) || 50));
  
  return { page: validPage, limit: validLimit };
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (!startDate && !endDate) {
    return { isValid: true, errors };
  }
  
  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('Invalid start date format');
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('Invalid end date format');
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate array of IDs
 * @param {Array} ids - Array of IDs
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
const validateIds = (ids) => {
  const errors = [];
  
  if (!isValidArray(ids)) {
    errors.push('IDs must be a non-empty array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmployee,
  validateLogin,
  validateLeaveRequest,
  validateSalary,
  validateFileUpload,
  validatePagination,
  validateDateRange,
  validateIds
};

