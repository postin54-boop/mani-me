// Admin notifies user about upcoming pickup
const { sendPushNotification } = require('../services/notificationService');
const User = require('../models/user');
const Shipment = require('../models/shipment');
const logger = require('../utils/logger');

const getRequestContext = (req) => {
  const userId = req.userId || req.user?.user_id || req.user?._id || req.user?.id;
  const role = String(req.user?.role || '').toUpperCase();
  const isAdmin = req.user?.isAdmin === true || role === 'ADMIN';

  return {
    userId: userId ? String(userId) : null,
    isAdmin,
  };
};

// Admin: Notify user about upcoming pickup date
exports.notifyUserPickupNear = async (req, res) => {
  try {
    const { userId, shipmentId, daysBefore } = req.body;
    // Find user and shipment
    const user = await User.findById(userId);
    const shipment = await Shipment.findById(shipmentId);
    if (!user || !shipment) {
      return res.status(404).json({ success: false, message: 'User or shipment not found' });
    }
    if (!user.push_token) {
      return res.status(400).json({ success: false, message: 'User has no push token' });
    }
    const pickupDate = shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleDateString() : 'soon';
    const title = 'Pickup Reminder';
    const body = `Your pickup is scheduled for ${pickupDate}. Please be ready.`;
    await sendPushNotification(user.push_token, title, body, {
      shipmentId: shipment._id,
      pickupDate: shipment.pickup_date,
      type: 'pickup_reminder',
    });
    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    logger.error('Error sending pickup reminder', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
// Notification Controller
const Notification = require('../models/notification');

// Create a notification (alias for sendNotification)
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, data } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, error: 'userId, title, and message are required' });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (err) {
    logger.error('Error creating notification', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Send a notification (save to DB and optionally push to device)
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, data } = req.body;
    const notification = new Notification({
      userId,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();
    // TODO: Integrate push notification service (e.g., FCM)
    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const { userId: queryUserId, limit } = req.query;
    const { userId, isAdmin } = getRequestContext(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const safeLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const query = isAdmin
      ? (queryUserId ? { userId: queryUserId } : {})
      : { userId };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    res.json({ success: true, notifications });
  } catch (err) {
    logger.error('Error fetching notifications', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ success: false, error: 'notificationId is required' });
    }

    const { userId, isAdmin } = getRequestContext(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const query = isAdmin
      ? { _id: notificationId }
      : { _id: notificationId, userId };

    const updated = await Notification.findOneAndUpdate(query, { read: true }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking notification as read', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get notifications for the currently logged-in user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId || req.user?.user_id || req.user?._id || req.user?.id;
    if (!userId) {
      return res.json({ success: true, notifications: [] });
    }
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    logger.error('Error fetching user notifications', { error: err.message });
    res.json({ success: true, notifications: [] });
  }
};

// Mark notification as read by ID (from URL param)
exports.markAsReadById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, isAdmin } = getRequestContext(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const query = isAdmin
      ? { _id: notificationId }
      : { _id: notificationId, userId };

    const updated = await Notification.findOneAndUpdate(query, { read: true }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking notification by ID as read', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get notifications for a specific driver
exports.getDriverNotifications = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { userId: requestingUserId, isAdmin } = getRequestContext(req);
    if (!requestingUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // IDOR Protection: Ensure driver can only access their own notifications unless admin
    if (!isAdmin && driverId !== requestingUserId) {
      return res.status(403).json({ success: false, error: 'You can only view your own notifications' });
    }

    const notifications = await Notification.find({
      $or: [
        { userId: driverId },
        { driverId: driverId },
        { recipientId: driverId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: driverId },
        { driverId: driverId },
        { recipientId: driverId },
      ],
      read: { $ne: true },
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    logger.error('Error fetching driver notifications', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark all notifications as read for a driver
exports.markAllDriverRead = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { userId: requestingUserId, isAdmin } = getRequestContext(req);
    if (!requestingUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // IDOR Protection: Ensure driver can only mark their own notifications unless admin
    if (!isAdmin && driverId !== requestingUserId) {
      return res.status(403).json({ success: false, error: 'You can only modify your own notifications' });
    }

    await Notification.updateMany(
      {
        $or: [
          { userId: driverId },
          { driverId: driverId },
          { recipientId: driverId },
        ],
        read: { $ne: true },
      },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking driver notifications as read', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Send broadcast notification to all users (admin only)
exports.sendBroadcast = async (req, res) => {
  try {
    const { title, message, type, promoCode, discount, expiresAt, targetScreen } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }
    
    const { sendBroadcastNotification, sendPromoNotification, sendMarketingNotification } = require('../services/notificationService');
    
    let results;
    
    if (type === 'promo' && promoCode) {
      results = await sendPromoNotification(promoCode, discount, message, expiresAt ? new Date(expiresAt) : null);
    } else {
      results = await sendMarketingNotification(title, message, targetScreen || 'Home');
    }
    
    // Also save to notification history for all users
    const User = require('../models/user');
    const users = await User.find({ role: 'CUSTOMER' }).select('_id');
    
    const notificationDocs = users.map(user => ({
      userId: user._id,
      title,
      message,
      data: { type: type || 'marketing', promoCode, discount },
      read: false,
      createdAt: new Date(),
    }));
    
    await Notification.insertMany(notificationDocs);
    
    res.json({ 
      success: true, 
      message: `Broadcast sent to ${results.sent} users`,
      results 
    });
  } catch (err) {
    logger.error('Error sending broadcast notification', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
