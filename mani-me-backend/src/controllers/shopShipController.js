const shopShipService = require('../services/shopShipService');
const stripe = require('../utils/stripe');
const { sendOrderReceiptEmail } = require('../utils/email');
const User = require('../models/user');

/**
 * Shop & Ship Controller
 * API endpoints for the Shop & Ship feature
 */

// ============ PRODUCTS ============

/**
 * GET /api/shop-ship/products
 * Get products with filtering, pagination, and sorting
 */
const getProducts = async (req, res) => {
  try {
    const result = await shopShipService.getProducts(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
};

/**
 * GET /api/shop-ship/products/:id
 * Get a single product by ID
 */
const getProductById = async (req, res) => {
  try {
    const product = await shopShipService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

/**
 * GET /api/shop-ship/categories
 * Get all product categories with counts
 */
const getCategories = async (req, res) => {
  try {
    const categories = await shopShipService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

/**
 * GET /api/shop-ship/featured
 * Get featured products for homepage
 */
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await shopShipService.getFeaturedProducts(limit);
    res.json(products);
  } catch (error) {
    console.error('Error getting featured products:', error);
    res.status(500).json({ error: 'Failed to get featured products' });
  }
};

/**
 * GET /api/shop-ship/search
 * Search products by text
 */
const searchProducts = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const products = await shopShipService.searchProducts(q, parseInt(limit) || 20);
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

// ============ SHIPPING BOXES ============

/**
 * GET /api/shop-ship/boxes
 * Get all shipping box options with pricing
 * Query params: delivery_type (optional) - 'standard' or 'express'
 */
const getShippingBoxes = async (req, res) => {
  try {
    const { delivery_type } = req.query;
    const boxes = await shopShipService.getShippingBoxes(delivery_type);
    res.json(boxes);
  } catch (error) {
    console.error('Error getting shipping boxes:', error);
    res.status(500).json({ error: 'Failed to get shipping boxes' });
  }
};

/**
 * POST /api/shop-ship/calculate-shipping
 * Calculate shipping cost for cart items
 * Body: { totalWeightKg, delivery_type (optional, defaults to 'standard') }
 */
const calculateShipping = async (req, res) => {
  try {
    const { totalWeightKg, delivery_type = 'standard' } = req.body;
    if (!totalWeightKg || totalWeightKg <= 0) {
      return res.status(400).json({ error: 'Valid total weight required' });
    }
    
    const box = await shopShipService.calculateBoxForWeight(totalWeightKg, delivery_type);
    res.json({
      box_size: box.size,
      box_name: box.name,
      shipping_cost: box.quantity ? box.total_shipping : box.price_gbp,
      quantity: box.quantity || 1,
      delivery_type: box.delivery_type || delivery_type,
      delivery_days_min: box.delivery_days_min,
      delivery_days_max: box.delivery_days_max
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
};

// ============ ORDERS ============

/**
 * POST /api/shop-ship/orders
 * Create a new Shop & Ship order
 */
const createOrder = async (req, res) => {
  try {
    const orderData = {
      customer_id: req.userId,
      ...req.body
    };
    
    const order = await shopShipService.createOrder(orderData);
    
    // Send order receipt email
    try {
      const user = await User.findById(req.userId);
      if (user && user.email) {
        await sendOrderReceiptEmail({
          email: user.email,
          name: user.name || 'Customer',
          orderType: 'Shop & Ship',
          orderId: order._id.toString(),
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: order.total_amount
        });
      }
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
};

/**
 * GET /api/shop-ship/orders
 * Get current user's orders
 */
const getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await shopShipService.getCustomerOrders(req.userId, status);
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

/**
 * GET /api/shop-ship/orders/:id
 * Get order details
 */
const getOrderById = async (req, res) => {
  try {
    const order = await shopShipService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify ownership (admin can access any order)
    const isOwner = order.customer_id.toString() === req.userId.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
};

/**
 * POST /api/shop-ship/orders/:id/cancel
 * Cancel an order
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await shopShipService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify ownership
    if (order.customer_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { reason } = req.body;
    const updatedOrder = await shopShipService.cancelOrder(req.params.id, reason);
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel order' });
  }
};

/**
 * POST /api/shop-ship/orders/:id/pay
 * Create payment intent for order
 */
const createPaymentIntent = async (req, res) => {
  try {
    const order = await shopShipService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify ownership
    if (order.customer_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convert to pence
      currency: 'gbp',
      metadata: {
        order_id: order._id.toString(),
        order_number: order.order_number,
        type: 'shop_ship'
      }
    });
    
    // Save payment intent ID
    order.payment_intent_id = paymentIntent.id;
    await order.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: order.total_amount
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// ============ ADMIN ============

/**
 * POST /api/shop-ship/admin/products
 * Add a new product (admin only)
 */
const addProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      added_by: req.userId
    };
    const product = await shopShipService.addProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: error.message || 'Failed to add product' });
  }
};

/**
 * PUT /api/shop-ship/admin/products/:id
 * Update a product (admin only)
 */
const updateProduct = async (req, res) => {
  try {
    const product = await shopShipService.updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

/**
 * DELETE /api/shop-ship/admin/products/:id
 * Delete a product (admin only)
 */
const deleteProduct = async (req, res) => {
  try {
    await shopShipService.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

/**
 * POST /api/shop-ship/admin/products/bulk
 * Bulk import products (admin only)
 */
const bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array required' });
    }
    const result = await shopShipService.bulkImportProducts(products);
    res.json(result);
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
};

/**
 * PUT /api/shop-ship/admin/orders/:id/status
 * Update order status (admin only)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }
    const order = await shopShipService.updateOrderStatus(req.params.id, status, note);
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message || 'Failed to update order' });
  }
};

/**
 * GET /api/shop-ship/admin/orders
 * Get all orders (admin only)
 */
const getAllOrders = async (req, res) => {
  try {
    const ShopShipOrder = require('../models/shopShipOrder');
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const [orders, total] = await Promise.all([
      ShopShipOrder.find(query)
        .populate('customer_id', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ShopShipOrder.countDocuments(query)
    ]);
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

/**
 * POST /api/shop-ship/seed-boxes
 * Seed default shipping boxes (admin only, one-time)
 */
const seedBoxes = async (req, res) => {
  try {
    await shopShipService.seedShippingBoxes();
    res.json({ message: 'Shipping boxes seeded successfully' });
  } catch (error) {
    console.error('Error seeding boxes:', error);
    res.status(500).json({ error: 'Failed to seed boxes' });
  }
};

module.exports = {
  // Products
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
  searchProducts,
  
  // Boxes
  getShippingBoxes,
  calculateShipping,
  seedBoxes,
  
  // Orders
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  createPaymentIntent,
  
  // Admin
  addProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  updateOrderStatus,
  getAllOrders
};
