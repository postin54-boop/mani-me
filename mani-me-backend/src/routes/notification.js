const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Create a notification (admin)
router.post('/', verifyAdmin, notificationController.createNotification);

// Get all notifications (admin) or user's notifications
router.get('/', verifyToken, notificationController.getNotifications);

// Get notifications for the currently logged-in user
router.get('/user', verifyToken, notificationController.getUserNotifications);

// Mark a notification as read (via body)
router.post('/read', verifyToken, notificationController.markAsRead);

// Mark notification as read by ID (via param)
router.post('/:notificationId/read', verifyToken, notificationController.markAsReadById);

// Get notifications for a specific driver
router.get('/driver/:driverId', verifyToken, notificationController.getDriverNotifications);

// Mark all notifications as read for a driver
router.post('/driver/:driverId/read-all', verifyToken, notificationController.markAllDriverRead);

// Send broadcast notification to all users (admin only)
router.post('/broadcast', verifyAdmin, notificationController.sendBroadcast);

module.exports = router;
