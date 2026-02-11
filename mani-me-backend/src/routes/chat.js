const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.post('/send', verifyToken, chatController.sendMessage);
router.get('/shipment/:shipment_id', verifyToken, chatController.getShipmentMessages);
router.get('/messages/:shipment_id', verifyToken, chatController.getShipmentMessagesCompat);
router.put('/mark-read/:shipment_id', verifyToken, chatController.markRead);
router.get('/unread/:user_id', verifyToken, chatController.getUnreadCount);
router.get('/support/:user_id', verifyToken, chatController.getSupportMessages);
router.get('/support-conversations', verifyAdmin, chatController.getSupportConversations);

module.exports = router;
