const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { requireAuth } = require('../middleware/auth');

router.post('/event', requireAuth, trackingController.addTrackingEvent);
router.get('/:parcel_id', requireAuth, trackingController.getTrackingTimeline);

module.exports = router;
