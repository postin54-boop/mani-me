// Admin notifies user about upcoming pickup
const { sendPushNotification } = require('../services/notificationService');
const User = require('../models/user');
const Shipment = require('../models/shipment');

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
    res.status(500).json({ success: false, error: err.message });
  }
};
// Notification Controller
const Notification = require('../models/notification');

// Create a notification (alias for sendNotification)
exports.createNotification = async (req, res) => {
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
    res.status(201).json({ success: true, notification });
  } catch (err) {
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
    const { userId } = req.query;
    // If no userId provided (admin request), get all notifications
    const query = userId ? { userId } : {};
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
