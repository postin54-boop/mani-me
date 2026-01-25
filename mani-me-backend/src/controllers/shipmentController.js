/**
 * Shipment Controller
 * Handles shipment-related business logic
 * @module controllers/shipmentController
 */

const Shipment = require('../models/shipment');
const logger = require('../utils/logger');

/**
 * Get shipment statistics for a user
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.userId - User ID to get stats for
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getShipmentStats = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [total, delivered, pending] = await Promise.all([
      Shipment.countDocuments({ userId }),
      Shipment.countDocuments({ userId, status: 'delivered' }),
      Shipment.countDocuments({ userId, status: 'pending' }),
    ]);
    
    res.json({ total, delivered, pending });
  } catch (error) {
    logger.error('Stats error:', { userId, error: error.message });
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};
