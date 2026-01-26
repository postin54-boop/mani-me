// ======================
// Custom Error Classes
// ======================
// Structured error classes for consistent API error handling

/**
 * Base API Error class
 * All custom errors should extend this
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code || this.name,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * 400 Bad Request - Invalid input/malformed request
 */
class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(400, message, details);
    this.name = 'BadRequestError';
    this.code = 'BAD_REQUEST';
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', details = null) {
    super(401, message, details);
    this.name = 'UnauthorizedError';
    this.code = 'UNAUTHORIZED';
  }
}

/**
 * 403 Forbidden - Authenticated but not permitted
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Access denied', details = null) {
    super(403, message, details);
    this.name = 'ForbiddenError';
    this.code = 'FORBIDDEN';
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
class NotFoundError extends ApiError {
  constructor(resource = 'Resource', details = null) {
    super(404, `${resource} not found`, details);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
    this.resource = resource;
  }
}

/**
 * 409 Conflict - Resource already exists or conflict
 */
class ConflictError extends ApiError {
  constructor(message = 'Resource already exists', details = null) {
    super(409, message, details);
    this.name = 'ConflictError';
    this.code = 'CONFLICT';
  }
}

/**
 * 422 Validation Error - Request body validation failed
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors = []) {
    super(422, message, { errors });
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.errors = errors;
  }
}

/**
 * 429 Rate Limit Error - Too many requests
 */
class RateLimitError extends ApiError {
  constructor(message = 'Too many requests, please try again later', retryAfter = 60) {
    super(429, message, { retryAfter });
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_EXCEEDED';
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
class InternalError extends ApiError {
  constructor(message = 'Internal server error', details = null) {
    super(500, message, details, false); // isOperational = false
    this.name = 'InternalError';
    this.code = 'INTERNAL_ERROR';
  }
}

/**
 * 502 Bad Gateway - External service failure
 */
class ExternalServiceError extends ApiError {
  constructor(serviceName = 'External service', message = null) {
    super(502, message || `${serviceName} is unavailable`, { service: serviceName });
    this.name = 'ExternalServiceError';
    this.code = 'EXTERNAL_SERVICE_ERROR';
    this.serviceName = serviceName;
  }
}

/**
 * 503 Service Unavailable - Server temporarily unavailable
 */
class ServiceUnavailableError extends ApiError {
  constructor(message = 'Service temporarily unavailable', retryAfter = 30) {
    super(503, message, { retryAfter });
    this.name = 'ServiceUnavailableError';
    this.code = 'SERVICE_UNAVAILABLE';
    this.retryAfter = retryAfter;
  }
}

/**
 * Payment Error - Stripe/payment related errors
 */
class PaymentError extends ApiError {
  constructor(message = 'Payment failed', stripeError = null) {
    const details = stripeError ? {
      type: stripeError.type,
      code: stripeError.code,
      decline_code: stripeError.decline_code,
    } : null;
    super(402, message, details);
    this.name = 'PaymentError';
    this.code = 'PAYMENT_ERROR';
  }
}

module.exports = {
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
