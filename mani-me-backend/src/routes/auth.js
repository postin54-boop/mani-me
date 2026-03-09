const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { auth } = require('../validations');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', registerLimiter, validate(auth.register), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Authenticate with email and password to receive JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginLimiter, validate(auth.login), authController.login);

// Public endpoints
router.get('/test', authController.test);
router.get('/me', authController.me);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(auth.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(auth.resetPassword), authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

/**
 * @swagger
 * /auth/update-push-token:
 *   post:
 *     tags: [Auth]
 *     summary: Update push notification token
 *     description: Save Expo push token for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pushToken]
 *             properties:
 *               pushToken:
 *                 type: string
 *                 example: ExponentPushToken[xxxxxx]
 *     responses:
 *       200:
 *         description: Push token updated
 *       401:
 *         description: Unauthorized
 */
router.post('/update-push-token', verifyToken, validate(auth.updatePushToken), authController.updatePushToken);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update user profile
 *     description: Update name, phone, or other profile fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put('/update-profile', verifyToken, validate(auth.updateProfile), authController.updateProfile);

module.exports = router;
