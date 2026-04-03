// ======================
// Payment Validation Schemas
// ======================
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// Create payment intent
const createPaymentIntent = {
  body: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('gbp', 'ghs', 'usd').default('gbp'),
    shipmentId: objectId.optional(),
    orderId: objectId.optional(),
    description: Joi.string().max(500).optional(),
    metadata: Joi.object().optional(),
  }),
};

// Confirm payment (used by mobile after 3DS/SCA)
const confirmPayment = {
  body: Joi.object({
    paymentIntentId: Joi.string().required(),
    paymentMethodId: Joi.string().optional(),
  }),
};

// Capture a pre-authorized payment (called when driver marks parcel collected)
const capturePayment = {
  body: Joi.object({
    shipmentId: objectId.required(),
  }),
};

// Record cash payment
const recordCashPayment = {
  body: Joi.object({
    shipmentId: objectId.required(),
    amount: Joi.number().positive().required(),
    collectedBy: objectId.required(), // Driver ID
    notes: Joi.string().max(500).optional(),
  }),
};

// Get payment by ID
const getById = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

// Get payments query
const getPayments = {
  query: Joi.object({
    shipmentId: objectId.optional(),
    userId: objectId.optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').optional(),
    method: Joi.string().valid('card', 'cash', 'mobile_money').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

// Refund payment
const refundPayment = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    amount: Joi.number().positive().optional(), // Partial refund amount
    reason: Joi.string().max(500).optional(),
  }),
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  capturePayment,
  recordCashPayment,
  getById,
  getPayments,
  refundPayment,
};
