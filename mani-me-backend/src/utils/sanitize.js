/**
 * Input Sanitization Utility
 * Protects against NoSQL injection and XSS attacks
 */
const mongoSanitize = require('mongo-sanitize');

/**
 * Sanitize input for MongoDB queries
 * Removes $ and . characters that could be used for injection
 */
const sanitizeInput = (input) => {
  if (input === null || input === undefined) return input;
  
  if (typeof input === 'string') {
    // Remove MongoDB operators and dangerous characters
    return mongoSanitize(input.trim());
  }
  
  if (typeof input === 'object') {
    return mongoSanitize(input);
  }
  
  return input;
};

/**
 * Escape special regex characters for safe use in MongoDB regex
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitize object recursively (for request bodies)
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return sanitizeInput(obj);
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip keys starting with $ (MongoDB operators)
    if (key.startsWith('$')) continue;
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Sanitize HTML to prevent XSS
 */
const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Express middleware to sanitize all request inputs
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = {
  sanitizeInput,
  escapeRegex,
  sanitizeObject,
  sanitizeHtml,
  sanitizeMiddleware,
};
