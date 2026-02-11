const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.post('/validate-promo', apiLimiter, paymentController.validatePromo);
router.post('/create-intent', verifyToken, paymentController.createIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
