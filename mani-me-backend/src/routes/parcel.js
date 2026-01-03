const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcelController');
const { requireAuth } = require('../middleware/auth');

router.get('/', parcelController.getWarehouseParcels);
router.get('/summary', parcelController.getWarehouseSummary);
router.post('/', requireAuth, parcelController.createParcelItem);
// ...other parcel routes

module.exports = router;
