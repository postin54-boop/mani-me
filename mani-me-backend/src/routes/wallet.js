const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { verifyToken } = require('../middleware/auth');

// Health check endpoint (no auth) to verify certificate loading
router.get('/health', walletController.healthCheck);

router.get('/pass/:shipmentId', verifyToken, walletController.generatePass);
router.get('/pass/:serialNumber/status', walletController.getPassStatus);

module.exports = router;
