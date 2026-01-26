// ======================
// Central Error Handler Middleware
// ======================
// Provides structured error responses for all error types

const {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ExternalServiceError,
  ServiceUnavailableError,
  PaymentError,
} = require('../utils/errors');

/**
 * Async handler wrapper - eliminates try/catch in controllers
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Convert various error types to ApiError
 * @param {Error} err - Original error
 * @returns {ApiError} Normalized API error
 */
const normalizeError = (err) => {
  // Already an ApiError
  if (err instanceof ApiError) {
    return err;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return new ValidationError('Validation failed', errors);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return new BadRequestError(`Invalid ${err.path}: ${err.value}`);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return new ConflictError(`${field} already exists`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    return new PaymentError(err.message, err);
  }

  // Axios/fetch errors (external services)
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return new ExternalServiceError('External service');
  }

  // Default to internal error
  return new InternalError(
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  );
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Normalize error to ApiError
  const apiError = normalizeError(err);

  // Build error response
  const response = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code || 'ERROR',
      statusCode: apiError.statusCode,
    },
  };

  // Include details if present
  if (apiError.details) {
    response.error.details = apiError.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  // Log error
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode: apiError.statusCode,
    message: apiError.message,
    userId: req.userId || req.user?.id || 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Only log stack for unexpected/server errors
  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logData.stack = err.stack;
    console.error('❌ SERVER ERROR:', JSON.stringify(logData, null, 2));
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  CLIENT ERROR:', JSON.stringify(logData, null, 2));
  }

  // Set retry-after header for rate limit errors
  if (apiError instanceof RateLimitError) {
    res.set('Retry-After', apiError.retryAfter);
  }

  // Send response
  res.status(apiError.statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  normalizeError,
  // Re-export error classes for convenience
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ExternalServiceError,
  ServiceUnavailableError,
  PaymentError,
};
