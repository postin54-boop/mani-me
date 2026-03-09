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
    // Booking mode
    booking_mode: Joi.string().valid('box', 'item').optional(),
    
    // Sender info
    sender_name: Joi.string().max(100).required(),
    sender_phone: phone.required(),
    sender_email: Joi.string().email().allow('', null).optional(),
    
    // Pickup address
    pickup_address: Joi.string().max(300).required(),
    pickup_city: Joi.string().max(100).required(),
    pickup_postcode: Joi.string().max(20).allow('', null).optional(),
    pickup_date: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().allow('', null)
    ).optional(),
    pickup_time: Joi.string().allow('', null).optional(),
    pickup_time_slot: Joi.string().allow('', null).optional(),
    
    // Receiver info
    receiver_name: Joi.string().max(100).required(),
    receiver_phone: phone.required(),
    receiver_email: Joi.string().email().allow('', null).optional(),
    receiver_alternate_phone: Joi.string().allow('', null).optional(),
    
    // Delivery address
    delivery_address: Joi.string().max(300).required(),
    delivery_city: Joi.string().max(100).required(),
    delivery_region: Joi.string().max(100).allow('', null).optional(),
    delivery_landmark: Joi.string().max(200).allow('', null).optional(),
    
    // Parcel details - optional since app uses boxes/items model
    parcel_size: Joi.string().valid('small', 'medium', 'large', 'extra-large').optional(),
    weight_kg: Joi.number().min(0.1).max(100).optional(),
    parcel_description: Joi.string().max(500).allow('', null).optional(),
    special_instructions: Joi.string().max(500).allow('', null).optional(),
    
    // Boxes (for box booking mode)
    boxes: Joi.array().items(Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().optional(),
      size: Joi.string().optional(),
      dimensions: Joi.string().optional(),
      price: Joi.number().min(0).optional(),
      quantity: Joi.number().integer().min(1).optional(),
    })).optional(),
    
    // Items (for item booking mode)
    items: Joi.array().items(Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().optional(),
      category: Joi.string().optional(),
      price: Joi.number().min(0).optional(),
      quantity: Joi.number().integer().min(1).optional(),
      value: Joi.number().min(0).optional(),
    })).optional(),
    
    // Payment
    payment_method: Joi.string().valid('card', 'cash', 'apple_pay', 'mobile_money').optional(),
    payment_status: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
    payment_amount: Joi.number().min(0).optional(),
    total_price: Joi.number().min(0).optional(),
    total_estimated_price: Joi.number().min(0).optional(),
    
    // Promo
    promo_code: Joi.string().allow('', null).optional(),
    promo_discount: Joi.number().min(0).optional(),
    
    // User reference
    user_id: objectId.optional(),
  }).unknown(true), // Allow additional fields for flexibility
};

// Update shipment status
const updateStatus = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(
      // Core statuses
      'pending', 'booked', 'pending_pickup', 'driver_assigned', 'driver_en_route',
      'picked_up', 'at_uk_warehouse', 'processing', 'departed_uk',
      'in_transit', 'arrived_ghana', 'customs', 'customs_cleared',
      'out_for_delivery', 'delivered', 
      // Exception statuses
      'cancelled', 'on_hold', 'returned',
      // Legacy aliases for backwards compatibility
      'parcel_collected' // Same as picked_up
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
