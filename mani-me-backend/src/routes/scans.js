const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { verifyToken } = require('../middleware/auth');

router.post('/bulk', verifyToken, scanController.bulkScan);

module.exports = router;
