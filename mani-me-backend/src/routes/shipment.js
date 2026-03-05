const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { trackingLimiter } = require('../middleware/rateLimiter');

// User routes (authenticated)
router.get('/recent/:userId', verifyToken, shipmentController.getRecent);
router.post('/create', verifyToken, shipmentController.create);
router.get('/user/:id', verifyToken, shipmentController.getUserShipments);
router.get('/stats/:userId', verifyToken, shipmentController.getStats);
router.put('/dropoff/:id', verifyToken, shipmentController.markDropoff);
router.put('/cancel/:id', verifyToken, shipmentController.cancel);
router.put('/cancel-dropoff/:id', verifyToken, shipmentController.cancelDropoff);
router.put('/reschedule/:id', verifyToken, shipmentController.reschedule);
router.delete('/dismiss/:id', verifyToken, shipmentController.dismiss);

// Size adjustment - Customer approve/reject extra charges
router.get('/:id/size-adjustment', verifyToken, shipmentController.getSizeAdjustment);
router.post('/:id/size-adjustment/approve', verifyToken, shipmentController.approveSizeAdjustment);
router.post('/:id/size-adjustment/reject', verifyToken, shipmentController.rejectSizeAdjustment);

// Status updates (driver/admin)
router.put('/update-status/:id', verifyToken, shipmentController.updateStatus);
router.put('/:id/status', verifyToken, shipmentController.updateStatusAlias);

// Admin routes
router.put('/assign-driver/:id', verifyAdmin, shipmentController.assignDriver);
router.put('/warehouse/:parcel_id/status', verifyAdmin, shipmentController.updateWarehouseStatus);

// Public (rate-limited) tracking
router.get('/track/:tracking_number', trackingLimiter, shipmentController.track);

// Warehouse lookup (authenticated)
router.get('/warehouse/:parcel_id', verifyToken, shipmentController.getWarehouseParcel);

module.exports = router;

