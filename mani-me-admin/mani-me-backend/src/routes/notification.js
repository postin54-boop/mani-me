const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Create a notification (admin)
router.post('/', verifyToken, notificationController.createNotification);

// Get all notifications (admin) or user's notifications
router.get('/', optionalAuth, notificationController.getNotifications);

// Get notifications for the currently logged in user
router.get('/user', verifyToken, async (req, res) => {
  try {
    const Notification = require('../models/notification');
    const userId = req.userId || req.user?.user_id || req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.json({ success: true, notifications: [] });
    }
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.json({ success: true, notifications: [] });
  }
});

// Mark a notification as read
router.post('/read', verifyToken, notificationController.markAsRead);

// Mark notification as read by ID
router.post('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const Notification = require('../models/notification');
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
