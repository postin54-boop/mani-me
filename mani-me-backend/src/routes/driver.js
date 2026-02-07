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

module.exports = router;
