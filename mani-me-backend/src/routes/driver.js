const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { driver } = require('../validations');

// SECURITY: Middleware to verify driver role
const verifyDriver = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'UK_DRIVER' && role !== 'GH_DRIVER' && role !== 'ADMIN') {
    return res.status(403).json({ message: 'Driver access required' });
  }
  next();
};

// Admin routes
router.get('/', verifyAdmin, driverController.getDrivers);
router.post('/', verifyAdmin, validate(driver.registerDriver), driverController.addDriver);

// Driver routes (requires driver role)
router.get('/:id/assignments', verifyToken, verifyDriver, driverController.getAssignments);
router.put('/pickups/:id/status', verifyToken, verifyDriver, driverController.updatePickupStatus);
router.put('/deliveries/:id/status', verifyToken, verifyDriver, driverController.updateDeliveryStatus);
router.post('/clock-in', verifyToken, verifyDriver, driverController.clockIn);
router.post('/clock-out', verifyToken, verifyDriver, driverController.clockOut);
router.get('/shifts/:driver_id', verifyToken, verifyDriver, driverController.getShiftHistory);
router.post('/location', verifyToken, verifyDriver, validate(driver.updateLocation), driverController.updateLocation);

// Size adjustment - Driver reports parcel size mismatch
router.post('/pickups/:id/size-adjustment', verifyToken, verifyDriver, driverController.reportSizeMismatch);
router.get('/pickups/:id/size-adjustment', verifyToken, verifyDriver, driverController.getSizeAdjustmentStatus);

// Document management - Driver uploads documents for verification
router.get('/documents', verifyToken, verifyDriver, driverController.getDocuments);
router.post('/documents/:documentType', verifyToken, verifyDriver, driverController.uploadDocument);

module.exports = router;
