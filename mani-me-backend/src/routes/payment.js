const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { payment } = require('../validations');

router.post('/validate-promo', apiLimiter, paymentController.validatePromo);
router.post('/create-intent', verifyToken, validate(payment.createPaymentIntent), paymentController.createIntent);
router.post('/capture', verifyToken, validate(payment.capturePayment), paymentController.capturePayment); // Capture pre-auth on pickup
router.post('/cancel-authorization', verifyToken, paymentController.cancelAuthorization); // Release hold on cancel
router.get('/status/:shipmentId', verifyToken, paymentController.getPaymentStatus); // Check payment status
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
