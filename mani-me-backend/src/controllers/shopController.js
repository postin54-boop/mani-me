/**
 * Shop Controller
 * @module controllers/shopController
 */

const PackagingItem = require('../models/packagingItem');
const PackagingOrder = require('../models/packagingOrder');
const User = require('../models/user');
const { sendPushNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

exports.getPackagingItems = async (req, res) => {
  try {
    const items = await PackagingItem.find();
    res.json(items);
  } catch (error) {
    logger.error('Error fetching packaging items', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch items' });
  }
};

exports.createPackagingItem = async (req, res) => {
  try {
    const item = new PackagingItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating packaging item', { error: error.message });
    res.status(500).json({ message: 'Failed to create item' });
  }
};

exports.updatePackagingItem = async (req, res) => {
  try {
    const item = await PackagingItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (error) {
    logger.error('Error updating packaging item', { error: error.message });
    res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.deletePackagingItem = async (req, res) => {
  try {
    const item = await PackagingItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Error deleting packaging item', { error: error.message });
    res.status(500).json({ message: 'Failed to delete item' });
  }
};

exports.createPackagingOrder = async (req, res) => {
  try {
    const { items, fulfillment_method, delivery_address, preferred_date, total_amount, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });
    if (!fulfillment_method || !['delivery', 'pickup'].includes(fulfillment_method)) return res.status(400).json({ message: 'Invalid fulfillment method' });
    if (fulfillment_method === 'delivery' && !delivery_address) return res.status(400).json({ message: 'Delivery address required' });

    const userId = req.user.user_id || req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ message: 'User ID not found in token' });

    const order = new PackagingOrder({
      user_id: userId, items, fulfillment_method,
      delivery_address: fulfillment_method === 'delivery' ? delivery_address : undefined,
      preferred_date, total_amount, notes, status: 'pending', payment_status: 'pending'
    });
    await order.save();

    // Notify admins
    try {
      const admins = await User.find({ role: 'admin', push_token: { $exists: true, $ne: null } });
      await Promise.allSettled(admins.map(admin =>
        sendPushNotification(admin.push_token, 'New Packaging Order', `New ${fulfillment_method} order: £${total_amount.toFixed(2)}`, { orderId: order._id, type: 'admin_packaging_order' })
      ));
    } catch (e) {
      logger.error('Admin notification error', { error: e.message });
    }

    res.status(201).json(order);
  } catch (error) {
    logger.error('Error creating packaging order', { error: error.message });
    res.status(500).json({ message: 'Failed to create order' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;
    // IDOR Protection: Ensure user can only access their own orders
    const requestingUserId = req.user?.user_id || req.user?.id || req.user?._id;
    if (userId !== requestingUserId && userId !== String(requestingUserId)) {
      return res.status(403).json({ message: 'You can only view your own orders' });
    }
    const orders = await PackagingOrder.find({ user_id: userId }).sort({ createdAt: -1 }).populate('items.item_id', 'name image_url price');
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching user orders', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await PackagingOrder.find().sort({ createdAt: -1 }).populate('user_id', 'fullName email phone').populate('items.item_id', 'name price');
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders (admin)', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

exports.adminUpdateOrder = async (req, res) => {
  try {
    const order = await PackagingOrder.findByIdAndUpdate(req.params.orderId, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    logger.error('Error updating order', { error: error.message });
    res.status(500).json({ message: 'Failed to update order' });
  }
};
