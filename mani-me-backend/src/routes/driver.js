const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Admin routes
router.get('/', verifyAdmin, driverController.getDrivers);
router.post('/', verifyAdmin, driverController.addDriver);

// Driver routes (authenticated)
router.get('/:id/assignments', verifyToken, driverController.getAssignments);
router.put('/pickups/:id/status', verifyToken, driverController.updatePickupStatus);
router.put('/deliveries/:id/status', verifyToken, driverController.updateDeliveryStatus);
router.post('/clock-in', verifyToken, driverController.clockIn);
router.post('/clock-out', verifyToken, driverController.clockOut);
router.get('/shifts/:driver_id', verifyToken, driverController.getShiftHistory);

// Size adjustment - Driver reports parcel size mismatch
router.post('/pickups/:id/size-adjustment', verifyToken, driverController.reportSizeMismatch);
router.get('/pickups/:id/size-adjustment', verifyToken, driverController.getSizeAdjustmentStatus);

module.exports = router;
