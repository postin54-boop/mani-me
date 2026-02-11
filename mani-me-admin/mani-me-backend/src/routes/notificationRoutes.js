// Admin: Notify user about upcoming pickup date
router.post('/notify-pickup-near', notificationController.notifyUserPickupNear);
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Send a notification
router.post('/send', notificationController.sendNotification);

// Get notifications for a user
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.post('/read', notificationController.markAsRead);

module.exports = router;
