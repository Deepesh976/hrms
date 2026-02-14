// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Application Constants
const APP_CONSTANTS = {
  // File upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_JSON_SIZE: '10mb',
  
  // JWT
  JWT_EXPIRY: '1h',
  
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  
  // Time formats
  DEFAULT_TIME_FORMAT: 'HH:mm:ss',
  DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
  
  // Employee status
  EMPLOYEE_STATUS: {
    WORKING: 'W',
    LEFT: 'L'
  },
  
  // Gender options
  GENDER: {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other'
  },
  
  // Attendance status
  ATTENDANCE_STATUS: {
    PRESENT: 'P',
    ABSENT: 'A',
    HALF_DAY: '½P',
    WEEKLY_OFF: 'WO',
    HOLIDAY: 'HO',
    LEAVE: 'L'
  },
  
  // Leave status
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  
  // Salary calculation constants
  SALARY: {
    ESI_THRESHOLD: 21000,
    ESI_EMPLOYEE_RATE: 0.0075, // 0.75%
    ESI_EMPLOYER_RATE: 0.0325, // 3.25%
    PF_RATE: 0.12, // 12%
    BONUS_RATE: 0.0833, // 8.33%
    
    // Professional Tax brackets
    PT_HIGH: 200,
    PT_MID: 150,
    PT_LOW: 100,
    PT_HIGH_THRESHOLD: 20000,
    PT_MID_THRESHOLD: 15000
  },
  
  // Attendance timing (in minutes from midnight)
  TIMING: {
    ON_TIME: 9 * 60 + 15, // 9:15 AM
    LATE_GRACE: 9 * 60 + 30, // 9:30 AM
    HALF_DAY_CUTOFF: 11 * 60, // 11:00 AM
    EARLY_EXIT_TIME: 15 * 60 + 30, // 3:30 PM
    MAX_LATE_ENTRIES: 3,
    MAX_EARLY_EXITS: 2
  },
  
  // File types
  ALLOWED_FILE_TYPES: {
    EXCEL: /xlsx|xls/,
    PDF: /pdf/,
    IMAGE: /jpeg|jpg|png|gif/
  },
  
  // Month names
  MONTH_NAMES: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  
  MONTH_ABBR: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  NO_TOKEN: 'No token provided',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Not authorized',
  FORBIDDEN: 'Not authorized for this role',
  
  // Generic
  SERVER_ERROR: 'Server error occurred',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  
  // Employee
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  EMPLOYEE_EXISTS: 'Employee already exists',
  NO_EMPLOYEE_DATA: 'No employee data provided',
  
  // Salary
  SALARY_NOT_FOUND: 'Salary record not found',
  SALARY_GENERATION_FAILED: 'Failed to generate salary',
  
  // File upload
  NO_FILE_UPLOADED: 'No file uploaded',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
  
  // Leave
  LEAVE_NOT_FOUND: 'Leave request not found',
  INVALID_LEAVE_STATUS: 'Invalid leave status',
  
  // Slip
  SLIP_NOT_FOUND: 'Slip not found',
  PDF_GENERATION_FAILED: 'Failed to generate PDF'
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_UPDATED: 'Password updated successfully',
  
  // Employee
  EMPLOYEE_CREATED: 'Employee created successfully',
  EMPLOYEE_UPDATED: 'Employee updated successfully',
  EMPLOYEE_DELETED: 'Employee deleted successfully',
  EMPLOYEES_UPLOADED: 'Employees uploaded successfully',
  
  // Salary
  SALARY_CREATED: 'Salary record created successfully',
  SALARY_UPDATED: 'Salary record updated successfully',
  SALARY_DELETED: 'Salary record deleted successfully',
  SALARY_GENERATED: 'Salary records generated successfully',
  
  // Activity
  ACTIVITY_UPLOADED: 'Activity data uploaded successfully',
  ACTIVITY_DELETED: 'Activity data deleted successfully',
  
  // Slip
  SLIP_CREATED: 'Slip created successfully',
  SLIP_DELETED: 'Slip deleted successfully',
  
  // Leave
  LEAVE_CREATED: 'Leave request created successfully',
  LEAVE_UPDATED: 'Leave status updated successfully'
};

module.exports = {
  HTTP_STATUS,
  APP_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};

