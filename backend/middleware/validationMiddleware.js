const { sendBadRequest } = require('../utils/responseHandler');
const {
  validateEmployee,
  validateLogin,
  validateLeaveRequest,
  validateSalary,
  validateFileUpload,
  validatePagination,
  validateDateRange,
  validateIds
} = require('../utils/validators');

/**
 * Middleware to validate employee data
 */
const validateEmployeeData = (req, res, next) => {
  const { isValid, errors } = validateEmployee(req.body);
  
  if (!isValid) {
    return sendBadRequest(res, 'Employee validation failed', errors);
  }
  
  next();
};

/**
 * Middleware to validate login credentials
 */
const validateLoginData = (req, res, next) => {
  const { isValid, errors } = validateLogin(req.body);
  
  if (!isValid) {
    return sendBadRequest(res, 'Login validation failed', errors);
  }
  
  next();
};

/**
 * Middleware to validate leave request
 */
const validateLeaveData = (req, res, next) => {
  const { isValid, errors } = validateLeaveRequest(req.body);
  
  if (!isValid) {
    return sendBadRequest(res, 'Leave request validation failed', errors);
  }
  
  next();
};

/**
 * Middleware to validate salary data
 */
const validateSalaryData = (req, res, next) => {
  const { isValid, errors } = validateSalary(req.body);
  
  if (!isValid) {
    return sendBadRequest(res, 'Salary validation failed', errors);
  }
  
  next();
};

/**
 * Middleware to validate file upload
 */
const validateFile = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    const { isValid, errors } = validateFileUpload(req.file, allowedTypes, maxSize);
    
    if (!isValid) {
      return sendBadRequest(res, 'File validation failed', errors);
    }
    
    next();
  };
};

/**
 * Middleware to validate and sanitize pagination parameters
 */
const validatePaginationParams = (req, res, next) => {
  const { page, limit } = validatePagination(req.query.page, req.query.limit);
  
  // Attach validated values to request
  req.pagination = { page, limit };
  
  next();
};

/**
 * Middleware to validate date range
 */
const validateDateRangeParams = (req, res, next) => {
  const { isValid, errors } = validateDateRange(req.query.startDate, req.query.endDate);
  
  if (!isValid) {
    return sendBadRequest(res, 'Date range validation failed', errors);
  }
  
  next();
};

/**
 * Middleware to validate array of IDs
 */
const validateIdsArray = (req, res, next) => {
  const { isValid, errors } = validateIds(req.body.ids);
  
  if (!isValid) {
    return sendBadRequest(res, 'IDs validation failed', errors);
  }
  
  next();
};

module.exports = {
  validateEmployeeData,
  validateLoginData,
  validateLeaveData,
  validateSalaryData,
  validateFile,
  validatePaginationParams,
  validateDateRangeParams,
  validateIdsArray
};

