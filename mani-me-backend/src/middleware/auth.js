const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set');
}

// Auth middleware for Firebase and role-based access
exports.requireAuth = (req, res, next) => {
  // ...verify Firebase token, set req.user
  next();
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

    // Check if user is admin
    const User = require('../models/user');
    const userId = decoded.user_id || decoded.id || decoded.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.userId = userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Optional auth - continues even if no token, but sets req.user if valid token exists
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
