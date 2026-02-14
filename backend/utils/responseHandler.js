const { HTTP_STATUS } = require('./constants');

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Additional error details
 */
const sendError = (res, message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors !== null) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {*} data - Created data
 * @param {string} message - Success message
 */
const sendCreated = (res, data = null, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Send bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Validation errors
 */
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, errors);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Send conflict response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendConflict = (res, message = 'Resource already exists') => {
  return sendError(res, message, HTTP_STATUS.CONFLICT);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total count
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      limit,
      totalItems: total,
      hasMore: page < totalPages
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendPaginated
};

