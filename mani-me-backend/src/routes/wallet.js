const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { verifyToken } = require('../middleware/auth');

router.get('/pass/:shipmentId', verifyToken, walletController.generatePass);
router.get('/pass/:serialNumber/status', walletController.getPassStatus);

module.exports = router;
