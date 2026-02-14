const { HTTP_STATUS } = require('../utils/constants');

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: req.body
  });

  // Determine status code
  const statusCode = res.statusCode && res.statusCode !== 200 
    ? res.statusCode 
    : err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Duplicate value for field: ${field}`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'File size exceeds limit'
    });
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = { 
  errorHandler, 
  notFoundHandler 
};
