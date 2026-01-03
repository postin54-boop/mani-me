// ======================
// Validation Middleware
// ======================
// Validates request data against Joi schemas

/**
 * Creates a validation middleware for the given schema
 * @param {Object} schema - Joi schema object with optional body, query, params keys
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors, not just the first
      allowUnknown: true, // Allow unknown keys (will be stripped)
      stripUnknown: true, // Remove unknown keys from validated data
    };

    const errors = [];

    // Validate body if schema provided
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          location: 'body'
        })));
      } else {
        req.body = value;
      }
    }

    // Validate query params if schema provided
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        errors.push(...error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          location: 'query'
        })));
      } else {
        req.query = value;
      }
    }

    // Validate URL params if schema provided
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          location: 'params'
        })));
      } else {
        req.params = value;
      }
    }

    // If any errors, return 400 with details
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
};

module.exports = validate;
