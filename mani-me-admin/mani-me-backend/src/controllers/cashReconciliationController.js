// ======================
// Cash Reconciliation Controller
// ======================
const cashReconciliationService = require('../services/cashReconciliationService');

// POST /cash-reconciliation
exports.submitCashReport = async (req, res) => {
  try {
    const { amount, photoUrl } = req.body;
    const driverId = req.user?.id || req.body.driverId;
    
    const report = await cashReconciliationService.submitReport({
      driverId,
      amount,
      photoUrl,
    });
    res.status(201).json(report);
  } catch (err) {
    if (err.message.includes('Missing required')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// GET /cash-reconciliation (admin)
exports.getAllReports = async (req, res) => {
  try {
    const { status, driverId, startDate, endDate } = req.query;
    const reports = await cashReconciliationService.getAllReports({
      status,
      driverId,
      startDate,
      endDate,
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /cash-reconciliation/:id/approve
exports.approveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const reviewerId = req.user?.id;
    
    const report = await cashReconciliationService.reviewReport(id, {
      status,
      notes,
      reviewerId,
    });
    res.json(report);
  } catch (err) {
    if (err.message === 'Report not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('Status must be')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// GET /cash-reconciliation/stats (admin)
exports.getStats = async (req, res) => {
  try {
    const stats = await cashReconciliationService.getSummaryStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
