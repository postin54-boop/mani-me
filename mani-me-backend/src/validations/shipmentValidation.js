// ======================
// Shipment Validation Schemas
// ======================
const Joi = require('joi');

// Common patterns
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(10).max(20);

// Address schema (reusable)
const addressSchema = Joi.object({
  name: Joi.string().max(100).required(),
  phone: phone.required(),
  addressLine: Joi.string().max(200).required(),
  city: Joi.string().max(100).required(),
  region: Joi.string().max(100).optional(),
  country: Joi.string().valid('UK', 'Ghana').required(),
  postcode: Joi.string().max(20).optional(),
  landmark: Joi.string().max(200).optional(),
});

// Create shipment
const createShipment = {
  body: Joi.object({
    // Sender info
    sender_name: Joi.string().max(100).required(),
    sender_phone: phone.required(),
    sender_email: Joi.string().email().optional(),
    
    // Pickup address
    pickup_address: Joi.string().max(300).required(),
    pickup_city: Joi.string().max(100).required(),
    pickup_postcode: Joi.string().max(20).optional(),
    pickup_date: Joi.date().iso().optional(),
    pickup_time_slot: Joi.string().optional(),
    
    // Receiver info
    receiver_name: Joi.string().max(100).required(),
    receiver_phone: phone.required(),
    receiver_email: Joi.string().email().optional(),
    
    // Delivery address
    delivery_address: Joi.string().max(300).required(),
    delivery_city: Joi.string().max(100).required(),
    delivery_region: Joi.string().max(100).optional(),
    delivery_landmark: Joi.string().max(200).optional(),
    
    // Parcel details
    parcel_size: Joi.string().valid('small', 'medium', 'large', 'extra-large').required(),
    weight_kg: Joi.number().min(0.1).max(100).optional(),
    parcel_description: Joi.string().max(500).optional(),
    special_instructions: Joi.string().max(500).optional(),
    
    // Items
    items: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      value: Joi.number().min(0).optional(),
    })).optional(),
    
    // Payment
    payment_method: Joi.string().valid('card', 'cash', 'mobile_money').optional(),
    total_price: Joi.number().min(0).optional(),
  }),
};

// Update shipment status
const updateStatus = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(
      'pending', 'booked', 'picked_up', 'in_transit', 
      'customs', 'out_for_delivery', 'delivered', 'cancelled'
    ).required(),
    notes: Joi.string().max(500).optional(),
  }),
};

// Assign driver
const assignDriver = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    driverId: objectId.required(),
    driverType: Joi.string().valid('pickup', 'delivery').required(),
  }),
};

// Reschedule pickup
const reschedulePickup = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    pickup_date: Joi.date().iso().required(),
    pickup_time_slot: Joi.string().optional(),
    reason: Joi.string().max(500).optional(),
  }),
};

// Get shipments query
const getShipments = {
  query: Joi.object({
    status: Joi.string().optional(),
    userId: objectId.optional(),
    driverId: objectId.optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('createdAt', '-createdAt', 'status', 'pickup_date').optional(),
  }),
};

// Get by ID
const getById = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

module.exports = {
  createShipment,
  updateStatus,
  assignDriver,
  reschedulePickup,
  getShipments,
  getById,
};
