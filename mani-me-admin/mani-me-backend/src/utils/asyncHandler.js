/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware
 */

/**
 * Wrap an async function to catch errors automatically
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped function that catches errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Wrap all methods of a controller object
 * @param {Object} controller - Controller object with async methods
 * @returns {Object} - Controller with wrapped methods
 */
const wrapController = (controller) => {
  const wrapped = {};
  for (const [key, value] of Object.entries(controller)) {
    if (typeof value === 'function') {
      wrapped[key] = asyncHandler(value);
    } else {
      wrapped[key] = value;
    }
  }
  return wrapped;
};

module.exports = { asyncHandler, wrapController };
