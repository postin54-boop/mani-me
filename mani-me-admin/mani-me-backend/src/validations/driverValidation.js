// ======================
// Driver Validation Schemas
// ======================
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(10).max(20);

// Register driver
const registerDriver = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(8).max(128).required(),
    phone: phone.required(),
    driverType: Joi.string().valid('UK', 'Ghana').required(),
    vehicleType: Joi.string().valid('car', 'van', 'motorcycle', 'bicycle').optional(),
    vehicleRegistration: Joi.string().max(20).optional(),
    licenseNumber: Joi.string().max(50).optional(),
  }),
};

// Update driver location
const updateLocation = {
  body: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    accuracy: Joi.number().positive().optional(),
    heading: Joi.number().min(0).max(360).optional(),
    speed: Joi.number().min(0).optional(),
  }),
};

// Update driver status
const updateStatus = {
  body: Joi.object({
    status: Joi.string().valid('available', 'busy', 'offline').required(),
  }),
};

// Accept/reject job
const respondToJob = {
  params: Joi.object({
    shipmentId: objectId.required(),
  }),
  body: Joi.object({
    action: Joi.string().valid('accept', 'reject').required(),
    reason: Joi.string().max(500).when('action', {
      is: 'reject',
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

// Complete pickup/delivery
const completeJob = {
  params: Joi.object({
    shipmentId: objectId.required(),
  }),
  body: Joi.object({
    action: Joi.string().valid('pickup', 'delivery').required(),
    signature: Joi.string().optional(), // Base64 signature
    photoUrl: Joi.string().uri().optional(),
    notes: Joi.string().max(500).optional(),
    recipientName: Joi.string().max(100).optional(),
  }),
};

// Get driver stats
const getStats = {
  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    period: Joi.string().valid('day', 'week', 'month', 'year').optional(),
  }),
};

// Get nearby drivers (admin)
const getNearby = {
  query: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().positive().max(100).default(10), // km
    driverType: Joi.string().valid('UK', 'Ghana').optional(),
    status: Joi.string().valid('available', 'busy', 'offline').optional(),
  }),
};

module.exports = {
  registerDriver,
  updateLocation,
  updateStatus,
  respondToJob,
  completeJob,
  getStats,
  getNearby,
};
