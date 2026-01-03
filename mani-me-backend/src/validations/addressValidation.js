// ======================
// Address Validation Schemas
// ======================
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(10).max(20);

// Create address
const createAddress = {
  body: Joi.object({
    userId: objectId.required(),
    label: Joi.string().max(50).required(), // e.g., "Home", "Work", "Mum's House"
    addressLine: Joi.string().max(200).required(),
    city: Joi.string().max(100).required(),
    region: Joi.string().max(100).optional(),
    country: Joi.string().valid('UK', 'Ghana').required(),
    postcode: Joi.string().max(20).optional(),
    phone: phone.optional(),
    isDefault: Joi.boolean().optional(),
  }),
};

// Update address
const updateAddress = {
  params: Joi.object({
    addressId: objectId.required(),
  }),
  body: Joi.object({
    label: Joi.string().max(50).optional(),
    addressLine: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    region: Joi.string().max(100).optional(),
    country: Joi.string().valid('UK', 'Ghana').optional(),
    postcode: Joi.string().max(20).optional(),
    phone: phone.optional(),
    isDefault: Joi.boolean().optional(),
  }),
};

// Get addresses for user
const getByUser = {
  params: Joi.object({
    userId: objectId.required(),
  }),
};

// Delete address
const deleteAddress = {
  params: Joi.object({
    addressId: objectId.required(),
  }),
};

module.exports = {
  createAddress,
  updateAddress,
  getByUser,
  deleteAddress,
};
