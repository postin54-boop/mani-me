// src/routes/cashReconciliation.js
const express = require('express');
const router = express.Router();
const cashReconciliationController = require('../controllers/cashReconciliationController');
// const { authenticate, isAdmin } = require('../middleware/auth');

// Driver submits cash report
router.post('/', /*authenticate,*/ cashReconciliationController.submitCashReport);

// Admin views all reports
router.get('/', /*authenticate, isAdmin,*/ cashReconciliationController.getAllReports);

// Admin gets summary stats
router.get('/stats', /*authenticate, isAdmin,*/ cashReconciliationController.getStats);

// Admin approves/rejects report
router.patch('/:id/approve', /*authenticate, isAdmin,*/ cashReconciliationController.approveReport);

module.exports = router;
