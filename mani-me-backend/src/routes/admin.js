const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { auth, shipment } = require('../validations');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

// Admin login rate limiter
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many admin login attempts, please try again after 15 minutes',
});

// Admin token verification middleware (uses isAdmin claim)
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin && decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    req.admin = decoded;
    req.userId = decoded.user_id || decoded.id || decoded.userId;
    next();
  } catch (error) {
    logger.error('Admin token verification error', { error: error.message });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth
router.post('/login', adminLoginLimiter, validate(auth.login), adminController.login);
router.get('/verify', verifyAdmin, adminController.verify);

// Two-Factor Authentication (2FA)
router.post('/2fa/setup', verifyAdmin, adminController.setup2FA);
router.post('/2fa/verify', verifyAdmin, adminController.verify2FA);
router.post('/2fa/disable', verifyAdmin, adminController.disable2FA);
router.get('/2fa/status', verifyAdmin, adminController.get2FAStatus);

// Dashboard
router.get('/dashboard', verifyAdmin, adminController.getDashboard);

// Orders
router.get('/orders', verifyAdmin, adminController.getOrders);
router.put('/orders/:id/status', verifyAdmin, validate(shipment.updateStatus), adminController.updateOrderStatus);

// Users
router.get('/users', verifyAdmin, adminController.getUsers);
router.put('/users/:id/status', verifyAdmin, adminController.updateUserStatus);

// Drivers
router.get('/drivers/uk', verifyAdmin, adminController.getUkDrivers);
router.get('/drivers/ghana', verifyAdmin, adminController.getGhanaDrivers);

// Driver Document Management
const driverController = require('../controllers/driverController');
router.put('/drivers/:driverId/documents/:documentType/status', verifyAdmin, driverController.updateDocumentStatus);

// Pickups & Deliveries
router.get('/pickups/pending', verifyAdmin, adminController.getPendingPickups);
router.get('/pickups/assigned', verifyAdmin, adminController.getAssignedPickups);
router.get('/deliveries/pending', verifyAdmin, adminController.getPendingDeliveries);

// Driver Assignment
router.put('/shipments/:id/assign-pickup-driver', verifyAdmin, validate(shipment.assignDriver), adminController.assignPickupDriver);
router.put('/shipments/:id/assign-delivery-driver', verifyAdmin, validate(shipment.assignDriver), adminController.assignDeliveryDriver);

module.exports = router;
