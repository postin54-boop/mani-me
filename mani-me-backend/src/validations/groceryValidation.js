// ======================
// Grocery Validation Schemas
// ======================
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const phone = Joi.string().pattern(/^[\d\s\-+()]+$/).min(10).max(20);

// Create grocery order
const createOrder = {
  body: Joi.object({
    items: Joi.array().items(Joi.object({
      itemId: objectId.required(),
      quantity: Joi.number().integer().min(1).required(),
    })).min(1).required(),
    
    // Delivery address
    deliveryAddress: Joi.object({
      name: Joi.string().max(100).required(),
      phone: phone.required(),
      addressLine: Joi.string().max(200).required(),
      city: Joi.string().max(100).required(),
      region: Joi.string().max(100).optional(),
      country: Joi.string().valid('UK', 'Ghana').required(),
      landmark: Joi.string().max(200).optional(),
    }).required(),
    
    notes: Joi.string().max(500).optional(),
    preferredDeliveryDate: Joi.date().iso().optional(),
  }),
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
