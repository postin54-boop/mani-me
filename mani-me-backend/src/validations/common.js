// ======================
// Common Validation Schemas
// ======================
const Joi = require('joi');

// MongoDB ObjectId pattern
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': '{{#label}} must be a valid ID',
});

// Phone number pattern (international)
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(10).max(20).messages({
  'string.pattern.base': '{{#label}} must be a valid phone number',
});

// Pagination query params
const pagination = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().optional(),
});

// Date range query params
const dateRange = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

// ID param (for GET/DELETE by ID)
const idParam = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

module.exports = {
  objectId,
  phone,
  pagination,
  dateRange,
  idParam,
};
