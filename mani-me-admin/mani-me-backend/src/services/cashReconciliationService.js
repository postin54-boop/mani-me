// ======================
// Cash Reconciliation Service
// ======================
// Business logic for driver cash reconciliation

const CashReconciliation = require('../models/cashReconciliation');

/**
 * Submit a new cash report from driver
 * @param {Object} reportData - Report details
 * @returns {Promise<Object>} Created report
 */
const submitReport = async (reportData) => {
  const { driverId, amount, photoUrl } = reportData;
  
  if (!driverId || !amount || !photoUrl) {
    throw new Error('Missing required fields: driverId, amount, photoUrl');
  }
  
  const report = await CashReconciliation.create({
    driver: driverId,
    amount,
    photoUrl,
    status: 'pending',
  });
  
  return report;
};

/**
 * Get all cash reconciliation reports
 * @param {Object} filters - Optional filters (status, driver, date range)
 * @returns {Promise<Array>} List of reports
 */
const getAllReports = async (filters = {}) => {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.driverId) {
    query.driver = filters.driverId;
  }
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }
  
  return await CashReconciliation.find(query)
    .populate('driver', 'name email phone')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });
};

/**
 * Get reports for a specific driver
 * @param {string} driverId - Driver ID
 * @returns {Promise<Array>} List of driver's reports
 */
const getReportsByDriver = async (driverId) => {
  return await CashReconciliation.find({ driver: driverId })
    .sort({ createdAt: -1 });
};

/**
 * Approve or reject a cash report
 * @param {string} reportId - Report ID
 * @param {Object} reviewData - Review details (status, notes, reviewerId)
 * @returns {Promise<Object>} Updated report
 */
const reviewReport = async (reportId, reviewData) => {
  const { status, notes, reviewerId } = reviewData;
  
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Status must be either "approved" or "rejected"');
  }
  
  const report = await CashReconciliation.findByIdAndUpdate(
    reportId,
    {
      status,
      notes,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    },
    { new: true }
  );
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  return report;
};

/**
 * Get report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Report
 */
const getReportById = async (reportId) => {
  const report = await CashReconciliation.findById(reportId)
    .populate('driver', 'name email phone')
    .populate('reviewedBy', 'name email');
    
  if (!report) {
    throw new Error('Report not found');
  }
  
  return report;
};

/**
 * Get summary statistics for cash reconciliation
 * @returns {Promise<Object>} Summary stats
 */
const getSummaryStats = async () => {
  const stats = await CashReconciliation.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
  
  const summary = {
    pending: { count: 0, totalAmount: 0 },
    approved: { count: 0, totalAmount: 0 },
    rejected: { count: 0, totalAmount: 0 },
  };
  
  stats.forEach((item) => {
    if (summary[item._id]) {
      summary[item._id] = {
        count: item.count,
        totalAmount: item.totalAmount,
      };
    }
  });
  
  return summary;
};

module.exports = {
  submitReport,
  getAllReports,
  getReportsByDriver,
  reviewReport,
  getReportById,
  getSummaryStats,
};
