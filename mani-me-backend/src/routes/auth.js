const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Public endpoints
router.get('/test', authController.test);
router.get('/me', authController.me);
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Protected endpoints
router.post('/update-push-token', verifyToken, authController.updatePushToken);
router.put('/update-profile', verifyToken, authController.updateProfile);

module.exports = router;
