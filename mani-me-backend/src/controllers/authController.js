/**
 * Auth Controller
 * Handles HTTP request/response for auth operations
 * @module controllers/authController
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * GET /auth/test - Connectivity check
 */
exports.test = (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is reachable',
    timestamp: new Date().toISOString()
  });
};

/**
 * GET /auth/me - Get current user from token
 */
exports.me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const user = await authService.getCurrentUser(token);
    return res.json({ user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    logger.error('Auth /me error:', { error: error.message, stack: error.stack });
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};

/**
 * POST /auth/register - Register a new user
 */
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logger.error('Registration error:', { error: error.message });
    const statusCode = error.statusCode || 500;
    const response = { message: error.message };
    if (error.errors) response.errors = error.errors;
    res.status(statusCode).json(statusCode >= 500 ? { error: 'Server error' } : response);
  }
};

/**
 * POST /auth/login - Login a user
 */
exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    logger.error('Login error:', { error: error.message });
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};

/**
 * POST /auth/update-push-token - Update user push notification token
 */
exports.updatePushToken = async (req, res) => {
  try {
    await authService.updatePushToken(req.body);
    return res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    logger.error('Push token update error:', { error: error.message });
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};

/**
 * PUT /auth/update-profile - Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.body);
    return res.json({
      message: 'Profile updated successfully',
      user: { ...user, address: req.body.address },
    });
  } catch (error) {
    logger.error('Profile update error:', { error: error.message });
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};

/**
 * POST /auth/refresh - Refresh JWT token
 */
exports.refresh = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const result = await authService.refreshToken(token);
    return res.json({
      message: 'Token refreshed successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    logger.error('Token refresh error:', { error: error.message });
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};
