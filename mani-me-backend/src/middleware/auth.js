/**
 * Authentication Middleware
 * Handles JWT verification and role-based access control
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set');
}

// Auth middleware - verifies JWT token and sets req.userId/req.user
exports.requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id || decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) return next();
  return res.status(403).json({ message: 'Forbidden' });
};

// JWT-based auth middleware (used by grocery and shop routes)
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id || decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin verification middleware
// Optimized: checks role from JWT first, falls back to DB for legacy tokens
exports.verifyAdmin = async (req, res, next) => {
  try {
    // First verify the JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.user_id || decoded.id || decoded.userId;
    req.userId = userId;

    // OPTIMIZATION: If role is in JWT (new tokens), skip DB lookup
    if (decoded.role) {
      if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      // Role verified from JWT - no DB call needed
      req.user = { _id: userId, role: decoded.role };
      return next();
    }

    // FALLBACK: Legacy tokens without role - must check DB
    const User = require('../models/user');
    const user = await User.findById(userId).select('role').lean();
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Admin verification error', { error: error.message });
    return res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

/**
 * Optional auth middleware
 * Continues even if no token, but sets req.user if valid token exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
exports.optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // No token - continue without user
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id || decoded.id;
    req.user = decoded;
  } catch (error) {
    // Invalid token - continue without user
  }
  next();
};
