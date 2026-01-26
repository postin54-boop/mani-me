// ======================
// Auth Validation Schemas
// ======================
const Joi = require('joi');

// Common fields
const email = Joi.string().email().lowercase().trim();
const password = Joi.string().min(8).max(128);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(10).max(20);

// Register new user
const register = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: email.required(),
    password: password.required(),
    phone: phone.optional(),
    country: Joi.string().valid('UK', 'Ghana').optional(),
  }),
};

// Login
const login = {
  body: Joi.object({
    email: email.required(),
    password: Joi.string().required(), // Don't validate length on login
  }),
};

// Update push token
const updatePushToken = {
  body: Joi.object({
    pushToken: Joi.string().required(),
  }),
};

// Forgot password
const forgotPassword = {
  body: Joi.object({
    email: email.required(),
  }),
};

// Reset password
const resetPassword = {
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: password.required(),
  }),
};

// Change password
const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: password.required(),
  }),
};

// Update profile
const updateProfile = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: phone.optional(),
    country: Joi.string().valid('UK', 'Ghana').optional(),
  }),
};

module.exports = {
  register,
  login,
  updatePushToken,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};
