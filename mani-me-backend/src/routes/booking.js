const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { shipment } = require('../validations');

router.post('/', requireAuth, validate(shipment.createShipment), bookingController.createBooking);
// ...other booking routes

module.exports = router;
