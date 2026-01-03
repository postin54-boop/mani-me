const express = require('express');
const router = express.Router();
const GroceryItem = require('../models/groceryItem');
const PackagingItem = require('../models/packagingItem');
const PackagingOrder = require('../models/packagingOrder');
const User = require('../models/user');
const { sendPushNotification } = require('../services/notificationService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set');
}

// Middleware to verify token (any authenticated user)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Not authorized' });
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// --- Grocery Items ---
router.get('/grocery', async (req, res) => {
  const items = await GroceryItem.find();
  res.json(items);
});
router.post('/grocery', verifyAdmin, async (req, res) => {
  const item = new GroceryItem(req.body);
  await item.save();
  // Notify all admins with push_token
  try {
    const admins = await User.find({ role: 'admin', push_token: { $exists: true, $ne: null } });
    const notifyPromises = admins.map(admin =>
      sendPushNotification(
        admin.push_token,
        'New Grocery Order',
        `A new grocery order has been placed: ${item.name}`,
        { itemId: item._id, type: 'admin_grocery_order' }
      )
    );
    await Promise.allSettled(notifyPromises);
  } catch (e) {
    console.error('Admin grocery order notification error:', e);
  }
  res.status(201).json(item);
});
router.put('/grocery/:id', verifyAdmin, async (req, res) => {
  const item = await GroceryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});
router.delete('/grocery/:id', verifyAdmin, async (req, res) => {
  const item = await GroceryItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// --- Packaging Items ---
router.get('/packaging', async (req, res) => {
  const items = await PackagingItem.find();
  res.json(items);
});
router.post('/packaging', verifyAdmin, async (req, res) => {
  const item = new PackagingItem(req.body);
  await item.save();
  // Notify all admins with push_token
  try {
    const admins = await User.find({ role: 'admin', push_token: { $exists: true, $ne: null } });
    const notifyPromises = admins.map(admin =>
      sendPushNotification(
        admin.push_token,
        'New Packaging Order',
        `A new packaging order has been placed: ${item.name}`,
        { itemId: item._id, type: 'admin_packaging_order' }
      )
    );
    await Promise.allSettled(notifyPromises);
  } catch (e) {
    console.error('Admin packaging order notification error:', e);
  }
  res.status(201).json(item);
});
router.put('/packaging/:id', verifyAdmin, async (req, res) => {
  const item = await PackagingItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});
router.delete('/packaging/:id', verifyAdmin, async (req, res) => {
  const item = await PackagingItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// --- Packaging Orders ---
// Create a new packaging order
router.post('/orders', verifyToken, async (req, res) => {
  try {
    const { items, fulfillment_method, delivery_address, preferred_date, total_amount, notes } = req.body;
    
    console.log('Order request received:', { items: items?.length, fulfillment_method, userId: req.user?.user_id });
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    if (!fulfillment_method || !['delivery', 'pickup'].includes(fulfillment_method)) {
      return res.status(400).json({ message: 'Invalid fulfillment method' });
    }
    if (fulfillment_method === 'delivery' && !delivery_address) {
      return res.status(400).json({ message: 'Delivery address required for delivery orders' });
    }

    // Ensure user_id is properly set from JWT token
    const userId = req.user.user_id || req.user.id || req.user._id;
    if (!userId) {
      console.error('No user ID found. req.user:', req.user);
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    console.log('Creating order for user:', userId);

    const order = new PackagingOrder({
      user_id: userId,
      items,
      fulfillment_method,
      delivery_address: fulfillment_method === 'delivery' ? delivery_address : undefined,
      preferred_date,
      total_amount,
      notes,
      status: 'pending',
      payment_status: 'pending'
    });
    
    console.log('Saving order...');
    await order.save();
    console.log('Order saved successfully:', order._id);
    
    // Notify admins
    try {
      const admins = await User.find({ role: 'admin', push_token: { $exists: true, $ne: null } });
      const notifyPromises = admins.map(admin =>
        sendPushNotification(
          admin.push_token,
          'New Packaging Order',
          `New ${fulfillment_method} order: £${total_amount.toFixed(2)}`,
          { orderId: order._id, type: 'admin_packaging_order' }
        )
      );
      await Promise.allSettled(notifyPromises);
    } catch (e) {
      console.error('Admin packaging order notification error:', e);
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Create packaging order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's packaging orders
router.get('/orders/user/:userId', verifyToken, async (req, res) => {
  try {
    const orders = await PackagingOrder.find({ user_id: req.params.userId })
      .populate('items.item_id')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all packaging orders (admin only)
router.get('/orders', verifyAdmin, async (req, res) => {
  try {
    const orders = await PackagingOrder.find()
      .populate('user_id', 'name email phone')
      .populate('items.item_id')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update packaging order status (admin only)
router.put('/orders/:orderId', verifyAdmin, async (req, res) => {
  try {
    const { status, payment_status, notes } = req.body;
    const order = await PackagingOrder.findByIdAndUpdate(
      req.params.orderId,
      { 
        status, 
        payment_status, 
        notes,
        ...(status === 'delivered' || status === 'completed' ? { fulfilledAt: new Date() } : {})
      },
      { new: true }
    ).populate('user_id', 'name email phone push_token');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Notify customer
    if (order.user_id?.push_token && status) {
      try {
        const statusMessages = {
          processing: 'Your packaging order is being processed',
          ready: 'Your packaging order is ready for pickup',
          delivered: 'Your packaging order has been delivered',
          completed: 'Your packaging order is complete',
          cancelled: 'Your packaging order has been cancelled'
        };
        await sendPushNotification(
          order.user_id.push_token,
          'Order Update',
          statusMessages[status] || `Order status: ${status}`,
          { orderId: order._id, type: 'packaging_order_update' }
        );
      } catch (e) {
        console.error('Customer order notification error:', e);
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
