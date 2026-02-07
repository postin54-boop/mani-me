const express = require('express');
const router = express.Router();
const parcelPriceController = require('../controllers/parcelPriceController');
const { verifyAdmin } = require('../middleware/auth');

// Get all parcel prices
router.get('/', parcelPriceController.getAllParcelPrices);

// Add or update a parcel price (admin only)
router.post('/', verifyAdmin, parcelPriceController.upsertParcelPrice);

module.exports = router;
