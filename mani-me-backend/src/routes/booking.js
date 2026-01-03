const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, bookingController.createBooking);
// ...other booking routes

module.exports = router;
