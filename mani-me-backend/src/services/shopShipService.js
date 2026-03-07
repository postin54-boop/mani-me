const ExternalProduct = require('../models/externalProduct');
const ShippingBox = require('../models/shippingBox');
const ShopShipOrder = require('../models/shopShipOrder');

/**
 * Shop & Ship Service
 * Handles external products, box pricing, and orders
 */

// ============ PRODUCTS ============

/**
 * Get all products with filtering
 */
const getProducts = async (filters = {}) => {
  const query = { is_active: true, in_stock: true };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.retailer) {
    query.retailer = filters.retailer;
  }
  
  if (filters.featured) {
    query.featured = true;
  }
  
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  if (filters.minPrice) {
    query.price = { ...query.price, $gte: parseFloat(filters.minPrice) };
  }
  
  if (filters.maxPrice) {
    query.price = { ...query.price, $lte: parseFloat(filters.maxPrice) };
  }
  
  const sort = {};
  switch (filters.sortBy) {
    case 'price_low':
      sort.price = 1;
      break;
    case 'price_high':
      sort.price = -1;
      break;
    case 'popular':
      sort.popularity = -1;
      break;
    case 'newest':
      sort.createdAt = -1;
      break;
    default:
      sort.featured = -1;
      sort.popularity = -1;
  }
  
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    ExternalProduct.find(query).sort(sort).skip(skip).limit(limit),
    ExternalProduct.countDocuments(query)
  ]);
  
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get product by ID
 */
const getProductById = async (productId) => {
  return ExternalProduct.findById(productId);
};

/**
 * Get product categories with counts
 */
const getCategories = async () => {
  const categories = await ExternalProduct.aggregate([
    { $match: { is_active: true, in_stock: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const categoryInfo = {
    electronics: { name: 'Electronics', icon: 'phone-portrait', color: '#3B82F6' },
    kitchen: { name: 'Kitchen', icon: 'restaurant', color: '#F59E0B' },
    baby: { name: 'Baby & Kids', icon: 'balloon', color: '#EC4899' },
    food: { name: 'Food & Groceries', icon: 'nutrition', color: '#10B981' },
    household: { name: 'Household', icon: 'home', color: '#8B5CF6' },
    clothing: { name: 'Clothing', icon: 'shirt', color: '#EF4444' },
    health: { name: 'Health', icon: 'medkit', color: '#14B8A6' },
    beauty: { name: 'Beauty', icon: 'sparkles', color: '#F472B6' }
  };
  
  return categories.map(cat => ({
    id: cat._id,
    ...categoryInfo[cat._id],
    count: cat.count
  }));
};

/**
 * Get featured products
 */
const getFeaturedProducts = async (limit = 10) => {
  return ExternalProduct.find({ is_active: true, in_stock: true, featured: true })
    .sort({ popularity: -1 })
    .limit(limit);
};

/**
 * Search products
 */
const searchProducts = async (searchTerm, limit = 20) => {
  return ExternalProduct.find({
    is_active: true,
    $text: { $search: searchTerm }
  })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

// ============ SHIPPING BOXES ============

/**
 * Get all shipping box options
 */
const getShippingBoxes = async () => {
  return ShippingBox.find({ is_active: true }).sort({ max_weight_kg: 1 });
};

/**
 * Calculate which box is needed for given weight
 */
const calculateBoxForWeight = async (totalWeightKg) => {
  const boxes = await ShippingBox.find({ is_active: true }).sort({ max_weight_kg: 1 });
  
  // Find the smallest box that fits the weight
  for (const box of boxes) {
    if (totalWeightKg <= box.max_weight_kg) {
      return box;
    }
  }
  
  // If weight exceeds all boxes, need multiple boxes
  const largestBox = boxes[boxes.length - 1];
  const numBoxes = Math.ceil(totalWeightKg / largestBox.max_weight_kg);
  
  return {
    ...largestBox.toObject(),
    quantity: numBoxes,
    total_shipping: largestBox.price_gbp * numBoxes
  };
};

/**
 * Seed default shipping boxes (run once)
 */
const seedShippingBoxes = async () => {
  const defaultBoxes = [
    {
      name: 'Small Box',
      description: 'Perfect for small electronics, documents, and lightweight items',
      size: 'small',
      max_weight_kg: 5,
      min_weight_kg: 0,
      dimensions: { length_cm: 30, width_cm: 20, height_cm: 15 },
      price_gbp: 25,
      icon: 'cube-outline',
      color: '#10B981'
    },
    {
      name: 'Medium Box',
      description: 'Great for clothes, household items, and medium electronics',
      size: 'medium',
      max_weight_kg: 15,
      min_weight_kg: 5,
      dimensions: { length_cm: 45, width_cm: 35, height_cm: 30 },
      price_gbp: 45,
      icon: 'cube',
      color: '#3B82F6'
    },
    {
      name: 'Large Box',
      description: 'Ideal for bulk groceries, multiple items, or large electronics',
      size: 'large',
      max_weight_kg: 30,
      min_weight_kg: 15,
      dimensions: { length_cm: 60, width_cm: 45, height_cm: 40 },
      price_gbp: 75,
      icon: 'archive',
      color: '#F59E0B'
    },
    {
      name: 'Extra Large Box',
      description: 'Maximum capacity for heavy or bulky shipments',
      size: 'extra_large',
      max_weight_kg: 50,
      min_weight_kg: 30,
      dimensions: { length_cm: 80, width_cm: 60, height_cm: 50 },
      price_gbp: 120,
      icon: 'filing',
      color: '#8B5CF6'
    }
  ];
  
  for (const box of defaultBoxes) {
    await ShippingBox.findOneAndUpdate(
      { size: box.size },
      box,
      { upsert: true, new: true }
    );
  }
  
  console.log('Shipping boxes seeded');
};

// ============ ORDERS ============

/**
 * Create a Shop & Ship order
 */
const createOrder = async (orderData) => {
  // Calculate totals
  let totalWeight = 0;
  let itemsTotal = 0;
  
  const itemsWithDetails = [];
  
  for (const item of orderData.items) {
    const product = await ExternalProduct.findById(item.product_id);
    if (!product) {
      throw new Error(`Product not found: ${item.product_id}`);
    }
    if (!product.in_stock) {
      throw new Error(`Product out of stock: ${product.name}`);
    }
    
    const itemWeight = product.weight_kg * item.quantity;
    const itemPrice = product.price * item.quantity;
    
    totalWeight += itemWeight;
    itemsTotal += itemPrice;
    
    itemsWithDetails.push({
      product_id: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      weight_kg: product.weight_kg,
      thumbnail: product.thumbnail || product.images[0],
      retailer: product.retailer
    });
    
    // Increment popularity
    await ExternalProduct.findByIdAndUpdate(product._id, {
      $inc: { popularity: item.quantity }
    });
  }
  
  // Calculate shipping box
  const box = await calculateBoxForWeight(totalWeight);
  const shippingCost = box.quantity ? box.total_shipping : box.price_gbp;
  
  // Service fee (5% of items, minimum £2)
  const serviceFee = Math.max(itemsTotal * 0.05, 2);
  
  // Total
  const totalAmount = itemsTotal + shippingCost + serviceFee - (orderData.discount || 0);
  
  const order = new ShopShipOrder({
    customer_id: orderData.customer_id,
    items: itemsWithDetails,
    total_weight_kg: totalWeight,
    box_size: box.quantity ? 'extra_large' : box.size,
    box_id: box._id,
    items_total: itemsTotal,
    shipping_cost: shippingCost,
    service_fee: serviceFee,
    discount: orderData.discount || 0,
    total_amount: totalAmount,
    delivery_address: orderData.delivery_address,
    customer_notes: orderData.customer_notes,
    status_history: [{ status: 'pending', note: 'Order created' }],
    estimated_purchase_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    estimated_ship_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    estimated_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  });
  
  await order.save();
  return order;
};

/**
 * Get orders for a customer
 */
const getCustomerOrders = async (customerId, status = null) => {
  const query = { customer_id: customerId };
  if (status) {
    query.status = status;
  }
  return ShopShipOrder.find(query).sort({ createdAt: -1 });
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId) => {
  return ShopShipOrder.findById(orderId).populate('items.product_id');
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, status, note = '') => {
  const order = await ShopShipOrder.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  order.status = status;
  order.status_history.push({ status, note, timestamp: new Date() });
  
  if (status === 'delivered') {
    order.actual_delivery_date = new Date();
  }
  
  await order.save();
  return order;
};

/**
 * Cancel order
 */
const cancelOrder = async (orderId, reason = '') => {
  const order = await ShopShipOrder.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (!['pending', 'paid', 'purchasing'].includes(order.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  
  order.status = 'cancelled';
  order.status_history.push({ status: 'cancelled', note: reason });
  
  await order.save();
  return order;
};

// ============ ADMIN PRODUCTS ============

/**
 * Add a product manually
 */
const addProduct = async (productData) => {
  const product = new ExternalProduct(productData);
  await product.save();
  return product;
};

/**
 * Update a product
 */
const updateProduct = async (productId, updates) => {
  return ExternalProduct.findByIdAndUpdate(productId, updates, { new: true });
};

/**
 * Delete a product (soft delete)
 */
const deleteProduct = async (productId) => {
  return ExternalProduct.findByIdAndUpdate(productId, { is_active: false });
};

/**
 * Bulk import products
 */
const bulkImportProducts = async (products) => {
  const results = { success: 0, failed: 0, errors: [] };
  
  for (const productData of products) {
    try {
      const product = new ExternalProduct(productData);
      await product.save();
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ product: productData.name, error: error.message });
    }
  }
  
  return results;
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
  calculateBoxForWeight,
  seedShippingBoxes,
  
  // Orders
  createOrder,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  
  // Admin
  addProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts
};
