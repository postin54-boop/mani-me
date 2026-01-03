const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, notificationController.createNotification);
// ...other notification routes

module.exports = router;
