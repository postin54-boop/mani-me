// src/routes/cashReconciliation.js
const express = require('express');
const router = express.Router();
const cashReconciliationController = require('../controllers/cashReconciliationController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Driver submits cash report
router.post('/', verifyToken, cashReconciliationController.submitCashReport);

// Admin views all reports
router.get('/', verifyAdmin, cashReconciliationController.getAllReports);

// Admin gets summary stats
router.get('/stats', verifyAdmin, cashReconciliationController.getStats);

// Admin approves/rejects report
router.patch('/:id/approve', verifyAdmin, cashReconciliationController.approveReport);

module.exports = router;
