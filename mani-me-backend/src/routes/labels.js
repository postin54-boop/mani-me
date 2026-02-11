const express = require('express');
const router = express.Router();
const labelController = require('../controllers/labelController');
const { verifyToken } = require('../middleware/auth');

router.get('/shipment/:id', verifyToken, labelController.getShipmentLabel);
router.get('/item/:id', verifyToken, labelController.getItemLabel);

module.exports = router;
