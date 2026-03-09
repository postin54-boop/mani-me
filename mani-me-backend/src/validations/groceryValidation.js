// ======================
// Grocery Validation Schemas
// ======================
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(7).max(20);

// Create grocery order - flexible validation to support mobile app format
const createOrder = {
  body: Joi.object({
    // Accept both itemId and item_id formats from mobile app
    items: Joi.array().items(Joi.object({
      itemId: objectId.optional(),
      item_id: objectId.optional(),
      quantity: Joi.number().integer().min(1).required(),
      // Allow extra fields from mobile app
      name: Joi.string().optional(),
      price: Joi.number().optional(),
      category: Joi.string().optional(),
    }).or('itemId', 'item_id')).min(1).required(),
    
    // Support both camelCase and snake_case address formats
    deliveryAddress: Joi.object({
      name: Joi.string().max(100).allow('').optional(),
      phone: phone.allow('').optional(),
      addressLine: Joi.string().max(200).allow('').optional(),
      street: Joi.string().max(200).allow('').optional(),
      city: Joi.string().max(100).required(),
      region: Joi.string().max(100).allow('').optional(),
      country: Joi.string().max(50).required(),
      postcode: Joi.string().max(20).allow('').optional(),
      landmark: Joi.string().max(200).allow('').optional(),
    }).optional(),
    
    // Also accept snake_case format from mobile app
    delivery_address: Joi.object({
      name: Joi.string().max(100).allow('').optional(),
      phone: phone.allow('').optional(),
      addressLine: Joi.string().max(200).allow('').optional(),
      street: Joi.string().max(200).allow('').optional(),
      city: Joi.string().max(100).required(),
      region: Joi.string().max(100).allow('').optional(),
      country: Joi.string().max(50).required(),
      postcode: Joi.string().max(20).allow('').optional(),
      landmark: Joi.string().max(200).allow('').optional(),
    }).optional(),
    
    // Extra fields from mobile app
    subtotal: Joi.number().optional(),
    shipping_cost: Joi.number().optional(),
    shippingCost: Joi.number().optional(),
    box_size: Joi.string().valid('small', 'medium', 'large').optional(),
    boxSize: Joi.string().valid('small', 'medium', 'large').optional(),
    
    notes: Joi.string().max(500).optional(),
    preferredDeliveryDate: Joi.date().iso().optional(),
  }).or('deliveryAddress', 'delivery_address'),
};

// Add grocery item (admin)
const addItem = {
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().required(),
    currency: Joi.string().valid('GBP', 'GHS').default('GBP'),
    category: Joi.string().max(50).required(),
    unit: Joi.string().max(20).default('each'), // e.g., "kg", "pack", "each"
    imageUrl: Joi.string().uri().optional(),
    inStock: Joi.boolean().default(true),
    stockQuantity: Joi.number().integer().min(0).optional(),
  }),
};

// Update grocery item (admin)
const updateItem = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().optional(),
    currency: Joi.string().valid('GBP', 'GHS').optional(),
    category: Joi.string().max(50).optional(),
    unit: Joi.string().max(20).optional(),
    imageUrl: Joi.string().uri().optional(),
    inStock: Joi.boolean().optional(),
    stockQuantity: Joi.number().integer().min(0).optional(),
  }),
};

// Get items query
const getItems = {
  query: Joi.object({
    category: Joi.string().optional(),
    inStock: Joi.boolean().optional(),
    search: Joi.string().max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

// Update order status (admin)
const updateOrderStatus = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'preparing', 'ready', 
      'out_for_delivery', 'delivered', 'cancelled'
    ).required(),
    notes: Joi.string().max(500).optional(),
  }),
};

module.exports = {
  createOrder,
  addItem,
  updateItem,
  getItems,
  updateOrderStatus,
};
