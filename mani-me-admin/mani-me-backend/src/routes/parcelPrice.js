const express = require('express');
const router = express.Router();
const parcelPriceController = require('../controllers/parcelPriceController');

// Get all parcel prices
router.get('/', parcelPriceController.getAllParcelPrices);

// Add or update a parcel price
router.post('/', parcelPriceController.upsertParcelPrice);

module.exports = router;
