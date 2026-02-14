/**
 * Async handler wrapper to catch errors in async route handlers
 * Automatically sends proper HTTP response instead of default 500
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} - Express middleware
 */
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      // If response already sent, delegate to Express
      if (res.headersSent) {
        return next(err);
      }

      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    }
  };
};

module.exports = asyncHandler;
